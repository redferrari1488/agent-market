#!/usr/bin/env node
// Smoke-test для опубликованных Docker-агентов. Деплоит каждого с фейковым
// конфигом из scripts/smoke-fixtures/<slug>.json, ждёт grace-период, проверяет
// что контейнер не упал в restart loop / не вывалился с entrypoint-валидацией,
// удаляет.
//
// Запуск: node scripts/smoke-agents.mjs [slug]
// Через docker (без node на хосте): bash scripts/smoke-agents.sh [slug]
//
// Требует доступ к /var/run/docker.sock. Без зависимостей — только Node builtins.

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "smoke-fixtures");
const SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const API_VERSION = "v1.43";
const DEFAULT_GRACE_MS = 30_000;
const DEFAULT_MEMORY_MB = 256;

function dockerRequest({ method, path: apiPath, body, raw }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: SOCKET,
        method,
        path: `/${API_VERSION}${apiPath}`,
        headers: body ? { "Content-Type": "application/json" } : {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (res.statusCode >= 400) {
            reject(
              Object.assign(
                new Error(
                  `Docker API ${method} ${apiPath} → ${res.statusCode}: ${buf.toString("utf8").slice(0, 500)}`,
                ),
                { statusCode: res.statusCode },
              ),
            );
            return;
          }
          if (raw) return resolve(buf);
          if (!buf.length) return resolve(null);
          try {
            resolve(JSON.parse(buf.toString("utf8")));
          } catch {
            resolve(buf.toString("utf8"));
          }
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function inspect(idOrName) {
  try {
    return await dockerRequest({ method: "GET", path: `/containers/${idOrName}/json` });
  } catch (err) {
    if (err.statusCode === 404) return null;
    throw err;
  }
}

async function ensureRemoved(name) {
  const info = await inspect(name);
  if (!info) return;
  await dockerRequest({
    method: "DELETE",
    path: `/containers/${encodeURIComponent(name)}?force=true&v=true`,
  }).catch(() => null);
}

// Docker multiplexes stdout/stderr с 8-байтовым префиксом на каждый фрейм
// (тип потока, размер payload), если контейнер запущен с TTY=false (наш случай).
// Декодируем фреймы, склеиваем payload в обычную строку.
function parseMultiplexedLogs(buf) {
  if (!buf || buf.length === 0) return "";
  const out = [];
  let i = 0;
  while (i < buf.length) {
    if (i + 8 > buf.length) {
      out.push(buf.subarray(i).toString("utf8"));
      break;
    }
    const streamType = buf[i];
    // 0=stdin, 1=stdout, 2=stderr. Если первый байт другой — это не наш формат.
    if (streamType > 2) {
      out.push(buf.subarray(i).toString("utf8"));
      break;
    }
    const size = buf.readUInt32BE(i + 4);
    out.push(buf.subarray(i + 8, i + 8 + size).toString("utf8"));
    i += 8 + size;
  }
  return out.join("");
}

async function getLogs(id, tail = 100) {
  try {
    const buf = await dockerRequest({
      method: "GET",
      path: `/containers/${id}/logs?stdout=true&stderr=true&tail=${tail}`,
      raw: true,
    });
    return parseMultiplexedLogs(buf);
  } catch {
    return "";
  }
}

// Smoke-test НЕ маунтит volume в /data и НЕ включает readonlyRootfs:
// для всех агентов rootfs пишемый, /data — обычная директория внутри образа
// (создана Dockerfile, права у user 1000:1000). Это упрощает scenario без
// потерь по точности: смок проверяет entrypoint+main.py, а не security
// профиль (тот уже зашит в src/lib/docker.ts и тестируется отдельно).
function buildHostConfig(memoryMb) {
  const memoryBytes = memoryMb * 1024 * 1024;
  return {
    Memory: memoryBytes,
    MemorySwap: memoryBytes,
    NanoCpus: 500_000_000,
    PidsLimit: 512,
    // Смок не должен пытаться рестартовать — нам нужно увидеть естественный
    // exit, если он есть. На production restartPolicy=unless-stopped.
    RestartPolicy: { Name: "no" },
    CapDrop: ["ALL"],
    SecurityOpt: ["no-new-privileges:true"],
    ReadonlyRootfs: false,
    Tmpfs: { "/tmp": "rw,noexec,nosuid,size=64m" },
  };
}

const ENTRYPOINT_FAIL_PATTERNS = [
  / is required\b/i,
  /must be one of:/i,
  /must be (an integer|numeric|at least|between)/i,
  /must be a JSON array/i,
];

// Эти ошибки указывают на сломанную сборку образа или main.py — они НИКОГДА
// не должны проходить smoke, даже если фикстура помечает контейнер
// expectExitWithinGrace. Импорт-/синтакс-эраторы это регресс продакшна.
const BOOT_FAIL_PATTERNS = [
  /ModuleNotFoundError/,
  /ImportError/,
  /SyntaxError/,
  /IndentationError/,
  /command not found/,
  /exec.*not found/i,
  /no such file or directory/i,
];

function matchAny(patterns, logs) {
  return patterns.some((re) => re.test(logs));
}

async function runOne(fx, slug, containerName) {
  console.log(`\n=== ${slug} ===`);
  console.log(`image: ${fx.image}`);

  await ensureRemoved(containerName);

  const env = Object.entries(fx.env).map(([k, v]) => `${k}=${v}`);
  const memoryMb = fx.memoryMb || DEFAULT_MEMORY_MB;
  const graceMs = (fx.graceSeconds || DEFAULT_GRACE_MS / 1000) * 1000;

  const create = await dockerRequest({
    method: "POST",
    path: `/containers/create?name=${encodeURIComponent(containerName)}`,
    body: {
      Image: fx.image,
      Env: env,
      ...(fx.user ? { User: fx.user } : {}),
      HostConfig: buildHostConfig(memoryMb),
    },
  });
  console.log(`created: ${create.Id.slice(0, 12)}`);

  await dockerRequest({ method: "POST", path: `/containers/${create.Id}/start` });
  console.log(`started, grace ${graceMs / 1000}s...`);

  await new Promise((r) => setTimeout(r, graceMs));

  const info = await inspect(create.Id);
  const logs = await getLogs(create.Id);

  // Cleanup ВСЕГДА, даже если что-то пошло не так.
  await dockerRequest({
    method: "DELETE",
    path: `/containers/${create.Id}?force=true&v=true`,
  }).catch(() => null);

  const state = info?.State || {};
  const running = !!state.Running;
  const exitCode = state.ExitCode ?? null;
  const restartCount = info?.RestartCount ?? 0;

  const acceptablePatterns = (fx.acceptableExitPatterns || []).map((s) => new RegExp(s));
  const matchedAcceptable = !running && matchAny(acceptablePatterns, logs);

  let pass;
  let reason;
  if (matchAny(BOOT_FAIL_PATTERNS, logs)) {
    pass = false;
    reason = "boot failure (import/syntax/missing file)";
  } else if (matchAny(ENTRYPOINT_FAIL_PATTERNS, logs)) {
    pass = false;
    reason = "entrypoint env validation failed";
  } else if (running && restartCount === 0) {
    pass = true;
    reason = "running, no restarts";
  } else if (matchedAcceptable) {
    pass = true;
    reason = `expected exit (code=${exitCode}), matched acceptable pattern`;
  } else if (!running && fx.expectExitWithinGrace) {
    pass = true;
    reason = `expected exit (code=${exitCode}), entrypoint validation passed`;
  } else if (!running) {
    pass = false;
    reason = `container exited (code=${exitCode}) within grace window`;
  } else {
    pass = false;
    reason = `unexpected state running=${running} restartCount=${restartCount}`;
  }

  console.log(
    `state: running=${running} exitCode=${exitCode} restartCount=${restartCount}`,
  );
  console.log(`${pass ? "PASS" : "FAIL"}: ${reason}`);

  if (!pass || process.env.SMOKE_VERBOSE) {
    const last = logs.split("\n").slice(-30).join("\n");
    console.log("--- logs (tail) ---");
    console.log(last || "(empty)");
    console.log("--- /logs ---");
  }

  return { slug, pass, reason, running, exitCode, restartCount };
}

async function main() {
  const only = process.argv[2];
  let files;
  try {
    files = (await fs.readdir(FIXTURES_DIR)).filter((f) => f.endsWith(".json"));
  } catch (err) {
    console.error(`Cannot read fixtures dir ${FIXTURES_DIR}: ${err.message}`);
    process.exit(2);
  }

  if (only) {
    files = files.filter((f) => f === `${only}.json` || f === only);
    if (!files.length) {
      console.error(`No fixture matches "${only}" in ${FIXTURES_DIR}`);
      process.exit(2);
    }
  }

  console.log(`smoke-test: ${files.length} fixtures, socket=${SOCKET}`);

  const results = [];
  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    let fx;
    try {
      fx = JSON.parse(await fs.readFile(path.join(FIXTURES_DIR, file), "utf8"));
    } catch (err) {
      console.error(`\n!! ${slug}: cannot parse fixture: ${err.message}`);
      results.push({ slug, pass: false, reason: `bad fixture: ${err.message}` });
      continue;
    }
    if (!fx.image) {
      console.error(`\n!! ${slug}: fixture missing "image"`);
      results.push({ slug, pass: false, reason: "fixture missing image" });
      continue;
    }
    const name = `smoke-${slug}-${Date.now().toString(36)}`;
    try {
      results.push(await runOne(fx, slug, name));
    } catch (err) {
      console.error(`\n!! ${slug}: ${err.message}`);
      await ensureRemoved(name).catch(() => null);
      results.push({ slug, pass: false, reason: err.message });
    }
  }

  console.log("\n=== summary ===");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.slug.padEnd(28)}  ${r.reason}`);
  }
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(2);
});
