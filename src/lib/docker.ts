import Docker from "dockerode";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { COMPUTE_CLASSES, DEFAULT_COMPUTE_CLASS, type ComputeClass } from "@/lib/compute";

// Подключение к Docker-демону. На проде идём через tecnativa/docker-socket-proxy
// по DOCKER_HOST=tcp://socket-proxy:2375 (см. docker-compose.yml). Локально —
// напрямую через unix-сокет.
function buildDockerOptions(): Docker.DockerOptions {
  const raw = process.env.DOCKER_HOST;
  if (!raw) return { socketPath: "/var/run/docker.sock" };

  if (raw.startsWith("unix://")) {
    return { socketPath: raw.replace(/^unix:\/\//, "") };
  }

  if (raw.startsWith("tcp://") || raw.startsWith("http://") || raw.startsWith("https://")) {
    const url = new URL(raw.replace(/^tcp:\/\//, "http://"));
    return {
      host: url.hostname,
      port: Number(url.port || (url.protocol === "https:" ? 2376 : 2375)),
      protocol: url.protocol === "https:" ? "https" : "http",
    };
  }

  // Fallback: hostname без схемы + DOCKER_PORT
  return { host: raw, port: Number(process.env.DOCKER_PORT || 2375) };
}

const docker = new Docker(buildDockerOptions());

// Имя bridge-сети для agent-контейнеров. compose поднимает её под именем
// `agent-market_agents`. postgres сюда НЕ подключён → даже compromise агента
// не даёт reachability на БД по внутренним именам.
const AGENT_NETWORK = process.env.AGENT_NETWORK || undefined;

const INTERNAL_CONFIG_PREFIX = "_meta_";
const LEGACY_INTERNAL_CONFIG_KEYS = new Set(["recurring_failures"]);

function isInternalConfigKey(key: string) {
  return key.startsWith(INTERNAL_CONFIG_PREFIX) || LEGACY_INTERNAL_CONFIG_KEYS.has(key);
}

function normalizeConfigValue(value: unknown) {
  if (typeof value !== "string") return undefined;

  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

function getRuntimeSecurityProfile(image: string) {
  if (image.includes("website-monitor")) {
    return {
      user: undefined,
      readonlyRootfs: false,
      tmpfs: undefined as Record<string, string> | undefined,
    };
  }

  if (
    image.includes("content-writer") ||
    image.includes("competitor-monitor") ||
    image.includes("news-digest-bot") ||
    image.includes("review-responder-2gis")
  ) {
    return {
      user: "1000:1000",
      readonlyRootfs: true,
      tmpfs: {
        "/tmp": "rw,noexec,nosuid,size=64m",
      },
    };
  }

  return {
    user: undefined,
    readonlyRootfs: false,
    tmpfs: undefined as Record<string, string> | undefined,
  };
}

function containerName(subscriptionId: string): string {
  return `agent-${subscriptionId}`;
}

function dataVolumeName(subscriptionId: string): string {
  return `agent-${subscriptionId}-data`;
}

function sidecarContainerName(subscriptionId: string, serviceName: string): string {
  return `agent-${subscriptionId}-${serviceName}`;
}

function sidecarVolumeName(subscriptionId: string, serviceName: string): string {
  return `agent-${subscriptionId}-${serviceName}-data`;
}

function subscriptionNetworkName(subscriptionId: string): string {
  return `agent-${subscriptionId}-net`;
}

// Спецификация сайдкара. Если у агента нет сайдкаров — getSidecars() вернёт [].
// Сайдкар стартует ДО основного контейнера в той же per-subscription сети.
// envContrib инжектится в env основного контейнера (например, MONGODB_URI).
type SidecarSpec = {
  serviceName: string;
  image: string;
  dataPath?: string;
  memoryMb: number;
  cpu: number;
  envContrib: Record<string, string>;
};

function getSidecars(image: string, subscriptionId: string): SidecarSpec[] {
  // ai-support-bot (father-bot upstream) хранит диалоги и настройки в MongoDB.
  // На подписку поднимаем отдельный mongo:7 в изолированной сети.
  if (image.includes("ai-support-bot")) {
    const host = sidecarContainerName(subscriptionId, "mongo");
    return [
      {
        serviceName: "mongo",
        image: "mongo:7",
        dataPath: "/data/db",
        memoryMb: 256,
        cpu: 0.25,
        envContrib: {
          MONGODB_URI: `mongodb://${host}:27017`,
          MONGODB_PORT: "27017",
        },
      },
    ];
  }
  return [];
}

async function ensureImagePresent(image: string): Promise<void> {
  try {
    await docker.getImage(image).inspect();
    return;
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) throw err;
  }

  await new Promise<void>((resolve, reject) => {
    docker.pull(image, (pullErr: unknown, stream: NodeJS.ReadableStream) => {
      if (pullErr) return reject(pullErr);
      docker.modem.followProgress(stream, (doneErr: unknown) => {
        if (doneErr) reject(doneErr);
        else resolve();
      });
    });
  });
}

async function ensureSubscriptionNetwork(subscriptionId: string): Promise<string> {
  const netName = subscriptionNetworkName(subscriptionId);
  try {
    await docker.getNetwork(netName).inspect();
    return netName;
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) throw err;
  }
  await docker.createNetwork({ Name: netName, Driver: "bridge" });
  return netName;
}

async function deploySidecar(
  subscriptionId: string,
  spec: SidecarSpec,
  networkName: string,
): Promise<void> {
  const name = sidecarContainerName(subscriptionId, spec.serviceName);

  // Снести предыдущий instance (на случай redeploy)
  try {
    const existing = docker.getContainer(name);
    const info = await existing.inspect();
    if (info.State.Running) await existing.stop();
    await existing.remove();
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) throw err;
  }

  await ensureImagePresent(spec.image);

  const memoryBytes = spec.memoryMb * 1024 * 1024;
  const mounts = spec.dataPath
    ? [
        {
          Type: "volume" as const,
          Source: sidecarVolumeName(subscriptionId, spec.serviceName),
          Target: spec.dataPath,
        },
      ]
    : undefined;

  const container = await docker.createContainer({
    Image: spec.image,
    name,
    HostConfig: {
      Memory: memoryBytes,
      MemorySwap: memoryBytes,
      NanoCpus: Math.round(spec.cpu * 1_000_000_000),
      PidsLimit: 256,
      RestartPolicy: { Name: "unless-stopped" },
      // Изоляция: те же ограничения что у основного агента. У сайдкара
      // нет прямого доступа к юзерским токенам — он не получает Env.
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges:true"],
      ...(mounts ? { Mounts: mounts } : {}),
      NetworkMode: networkName,
    },
  });

  await container.start();
}

function isDockerMissingResourceError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "statusCode" in err) {
    const statusCode = (err as { statusCode?: unknown }).statusCode;
    if (statusCode === 404) return true;
  }

  const message = err instanceof Error ? err.message : String(err);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("no such container") ||
    normalized.includes("no such volume") ||
    normalized.includes("not found")
  );
}

// Собираем env vars из зашифрованного конфига юзера + env_template агента
async function buildEnv(subscriptionId: string): Promise<string[]> {
  const [row] = await db
    .select({
      config: subscriptions.config,
      envTemplate: agents.envTemplate,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (!row) throw new Error("Подписка не найдена");

  // env_template — статичные переменные от продавца
  const template = (row.envTemplate as Record<string, string>) || {};

  // config — зашифрованный JSON с данными юзера
  let userConfig: Record<string, string> = {};
  if (row.config && typeof row.config === "string") {
    try {
      userConfig = JSON.parse(decrypt(row.config));
    } catch {
      // Если config не зашифрован (legacy или пустой JSON)
      userConfig = {};
    }
  } else if (row.config && typeof row.config === "object" && !Array.isArray(row.config)) {
    userConfig = Object.fromEntries(
      Object.entries(row.config as Record<string, unknown>).flatMap(([key, value]) => {
        if (isInternalConfigKey(key)) return [];

        const normalized = normalizeConfigValue(value);
        return normalized === undefined ? [] : [[key, normalized] as const];
      }),
    );
  }

  // Phase 0: AI managed платформой через OpenRouter. Подкидываем платформенный
  // ключ последним — юзерский config не сможет перетереть. См. agents-src/ai_provider.py.
  const platformAi = process.env.OPENROUTER_API_KEY
    ? {
        OPENAI_API_KEY: process.env.OPENROUTER_API_KEY,
        OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
      }
    : {};

  const merged = { ...template, ...userConfig, ...platformAi };
  return Object.entries(merged).map(([k, v]) => `${k}=${v}`);
}

export async function deployContainer(subscriptionId: string): Promise<string> {
  const name = containerName(subscriptionId);

  // Получаем docker_image и compute_class агента
  const [row] = await db
    .select({
      dockerImage: agents.dockerImage,
      computeClass: agents.computeClass,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (!row?.dockerImage) {
    throw new Error("Docker-образ не указан для этого агента");
  }

  // Удаляем старый контейнер если есть
  try {
    const existing = docker.getContainer(name);
    const info = await existing.inspect();
    if (info.State.Running) await existing.stop();
    // Без { v: true } Docker удаляет только контейнер, а named volume сохраняет.
    await existing.remove();
  } catch {
    // Контейнер не существует — ок
  }

  // Сайдкары (mongo и т.п.) поднимаются ДО основного контейнера в
  // изолированной per-subscription сети. envContrib каждого сайдкара
  // (например, MONGODB_URI) инжектится в env основного — юзер не может
  // его перетереть (см. порядок merge в buildEnv).
  const sidecars = getSidecars(row.dockerImage, subscriptionId);
  let networkMode: string | undefined = AGENT_NETWORK;
  if (sidecars.length > 0) {
    networkMode = await ensureSubscriptionNetwork(subscriptionId);
    for (const spec of sidecars) {
      await deploySidecar(subscriptionId, spec, networkMode);
    }
  }

  const baseEnv = await buildEnv(subscriptionId);
  const sidecarEnv = sidecars.flatMap((spec) =>
    Object.entries(spec.envContrib).map(([k, v]) => `${k}=${v}`),
  );
  const env = [...baseEnv, ...sidecarEnv];

  // Лимиты ресурсов по compute_class (S/M/L). Хостинг за эти ресурсы
  // включён в цену — если класс не задан, страхуемся минимальным S.
  const classId: ComputeClass =
    row.computeClass && row.computeClass in COMPUTE_CLASSES
      ? (row.computeClass as ComputeClass)
      : DEFAULT_COMPUTE_CLASS;
  const limits = COMPUTE_CLASSES[classId];
  const memoryBytes = limits.memoryMb * 1024 * 1024;
  const securityProfile = getRuntimeSecurityProfile(row.dockerImage);
  const mounts = limits.diskGb > 0
    ? [{
        Type: "volume" as const,
        Source: `agent-${subscriptionId}-data`,
        Target: "/data",
      }]
    : undefined;

  const container = await docker.createContainer({
    Image: row.dockerImage,
    name,
    Env: env,
    ...(securityProfile.user ? { User: securityProfile.user } : {}),
    HostConfig: {
      Memory: memoryBytes,
      // MemorySwap = Memory → swap выключен, защищает хост от свопа
      MemorySwap: memoryBytes,
      NanoCpus: Math.round(limits.cpu * 1_000_000_000),
      // Fork-бомба → контейнер сам себя убивает, не роняет VPS
      PidsLimit: 512,
      RestartPolicy: { Name: "unless-stopped" },
      // Базовая изоляция, безопасная для всех агентов из agents-src/.
      // Агенты — outbound-клиенты (Telegram/AI API), порты не биндят, поэтому
      // дроп всех Linux caps ничего не ломает. no-new-privileges блокирует
      // SUID-эскалацию даже если внутри есть root.
      // Seccomp оставляем на дефолтном docker-профиле: он режет опасные
      // syscalls, а seccomp=unconfined был бы ослаблением изоляции.
      // seccomp=default не задаём: на Docker 29 daemon трактует его как путь
      // к файлу профиля и падает, если файла `default` нет на хосте.
      // Для наших Python-агентов включаем non-root + read-only rootfs, потому
      // что они пишут только в volume `/data`, а pyc-файлы отключены на уровне
      // образов. Website Monitor оставляем исключением: changedetection.io
      // всё ещё требует более мягкий профиль и проверяется отдельно.
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges:true"],
      ReadonlyRootfs: securityProfile.readonlyRootfs,
      ...(securityProfile.tmpfs ? { Tmpfs: securityProfile.tmpfs } : {}),
      ...(mounts ? { Mounts: mounts } : {}),
      ...(networkMode ? { NetworkMode: networkMode } : {}),
    },
  });

  await container.start();

  // Сохраняем container_id в БД
  await db
    .update(subscriptions)
    .set({ containerId: container.id, status: "active" })
    .where(eq(subscriptions.id, subscriptionId));

  return container.id;
}

export async function stopContainer(subscriptionId: string): Promise<void> {
  const name = containerName(subscriptionId);
  try {
    const container = docker.getContainer(name);
    await container.stop();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("not running") && !message.includes("No such container")) {
      throw err;
    }
  }

  await db
    .update(subscriptions)
    .set({ status: "paused" })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function restartContainer(subscriptionId: string): Promise<void> {
  const name = containerName(subscriptionId);
  try {
    const container = docker.getContainer(name);
    await container.restart();
  } catch {
    // Если контейнера нет — деплоим заново
    await deployContainer(subscriptionId);
    return;
  }

  await db
    .update(subscriptions)
    .set({ status: "active" })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function removeContainerArtifacts(subscriptionId: string): Promise<void> {
  const name = containerName(subscriptionId);

  try {
    const container = docker.getContainer(name);
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop();
    }
    await container.remove({ force: true });
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) {
      throw err;
    }
  }

  try {
    const volume = docker.getVolume(dataVolumeName(subscriptionId));
    await volume.remove();
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) {
      throw err;
    }
  }

  // Сносим все сайдкар-контейнеры подписки. На момент deletion мы не знаем
  // какой образ был — нет смысла перечитывать DB. Discover'им через
  // listContainers по name prefix `/agent-<id>-` (главный уже снесён выше).
  try {
    const all = await docker.listContainers({
      all: true,
      filters: { name: [`agent-${subscriptionId}-`] },
    });
    for (const info of all) {
      const sidecar = docker.getContainer(info.Id);
      try {
        if (info.State === "running") await sidecar.stop();
        await sidecar.remove({ force: true });
      } catch (innerErr: unknown) {
        if (!isDockerMissingResourceError(innerErr)) throw innerErr;
      }
    }
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) throw err;
  }

  // Сайдкар-volumes: имена префиксированы. listVolumes возвращает массив,
  // фильтруем по prefix вручную (Docker filter API по name делает substring).
  try {
    const list = await docker.listVolumes();
    const prefix = `agent-${subscriptionId}-`;
    for (const v of list.Volumes ?? []) {
      if (v.Name.startsWith(prefix) && v.Name !== dataVolumeName(subscriptionId)) {
        try {
          await docker.getVolume(v.Name).remove();
        } catch (innerErr: unknown) {
          if (!isDockerMissingResourceError(innerErr)) throw innerErr;
        }
      }
    }
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) throw err;
  }

  // Per-subscription network (если был создан под сайдкары).
  try {
    await docker.getNetwork(subscriptionNetworkName(subscriptionId)).remove();
  } catch (err: unknown) {
    if (!isDockerMissingResourceError(err)) throw err;
  }
}

export async function getContainerLogs(
  subscriptionId: string,
  tail: number = 100
): Promise<string> {
  const name = containerName(subscriptionId);
  try {
    const container = docker.getContainer(name);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });
    // logs может быть Buffer или string
    return typeof logs === "string" ? logs : logs.toString("utf8");
  } catch {
    return "";
  }
}

export type ContainerStatus = "running" | "stopped" | "error" | "not_found";

export async function getContainerStatus(
  subscriptionId: string
): Promise<ContainerStatus> {
  const name = containerName(subscriptionId);
  try {
    const container = docker.getContainer(name);
    const info = await container.inspect();
    if (info.State.Running) return "running";
    if (info.State.ExitCode !== 0) return "error";
    return "stopped";
  } catch {
    return "not_found";
  }
}
