import Docker from "dockerode";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { COMPUTE_CLASSES, DEFAULT_COMPUTE_CLASS, type ComputeClass } from "@/lib/compute";

// Подключение к Docker-демону на VPS
// DOCKER_HOST=unix:///var/run/docker.sock (локально) или ssh://user@ip
const docker = new Docker(
  process.env.DOCKER_HOST
    ? { host: process.env.DOCKER_HOST, port: Number(process.env.DOCKER_PORT || 2375) }
    : { socketPath: "/var/run/docker.sock" }
);

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

  const merged = { ...template, ...userConfig };
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

  const env = await buildEnv(subscriptionId);

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
