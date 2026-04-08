import Docker from "dockerode";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";

// Подключение к Docker-демону на VPS
// DOCKER_HOST=unix:///var/run/docker.sock (локально) или ssh://user@ip
const docker = new Docker(
  process.env.DOCKER_HOST
    ? { host: process.env.DOCKER_HOST, port: Number(process.env.DOCKER_PORT || 2375) }
    : { socketPath: "/var/run/docker.sock" }
);

function containerName(subscriptionId: string): string {
  return `agent-${subscriptionId}`;
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
  } else if (row.config && typeof row.config === "object") {
    userConfig = row.config as Record<string, string>;
  }

  const merged = { ...template, ...userConfig };
  return Object.entries(merged).map(([k, v]) => `${k}=${v}`);
}

export async function deployContainer(subscriptionId: string): Promise<string> {
  const name = containerName(subscriptionId);

  // Получаем docker_image агента
  const [row] = await db
    .select({ dockerImage: agents.dockerImage })
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
    await existing.remove();
  } catch {
    // Контейнер не существует — ок
  }

  const env = await buildEnv(subscriptionId);

  const container = await docker.createContainer({
    Image: row.dockerImage,
    name,
    Env: env,
    HostConfig: {
      Memory: 256 * 1024 * 1024, // 256MB
      NanoCpus: 0.5e9, // 0.5 CPU
      RestartPolicy: { Name: "unless-stopped" },
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
