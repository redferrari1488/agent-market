// Серверная валидация config подписки против setup_schema агента.
// Используется во ВСЕХ путях, ведущих к deployContainer/restartContainer —
// чтобы запретить запуск контейнера с неполным/невалидным конфигом и не
// создавать ситуацию когда агент сразу падает в restart loop с сырым
// Python traceback. См. instructions/agents-build.md.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, subscriptions } from "@/lib/db/schema";
import { decrypt } from "@/lib/encryption";

export type SetupField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "select" | "json_array";
  options?: string[];
  required?: boolean;
};

export type ConfigValidationResult =
  | { ok: true }
  | { ok: false; missing: string[]; invalid: string[]; message: string };

export function validateConfigAgainstSchema(
  schema: SetupField[],
  config: Record<string, string>,
): ConfigValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const field of schema) {
    if (!field || !field.key) continue;
    if (field.required === false) continue;
    const value = (config[field.key] ?? "").trim();

    if (!value) {
      missing.push(field.label || field.key);
      continue;
    }

    if (field.type === "json_array") {
      try {
        const arr = JSON.parse(value);
        if (!Array.isArray(arr) || arr.length === 0) {
          invalid.push(`${field.label}: ожидается непустой JSON-массив`);
        } else if (arr.some((x) => typeof x !== "string")) {
          invalid.push(`${field.label}: все элементы массива должны быть строками`);
        }
      } catch {
        invalid.push(`${field.label}: не валидный JSON`);
      }
    }

    if (field.type === "select" && field.options && !field.options.includes(value)) {
      invalid.push(`${field.label}: допустимы только ${field.options.join(", ")}`);
    }
  }

  if (!missing.length && !invalid.length) return { ok: true };

  const parts: string[] = [];
  if (missing.length) parts.push(`Заполни: ${missing.join(", ")}`);
  if (invalid.length) parts.push(invalid.join("; "));
  return {
    ok: false,
    missing,
    invalid,
    message: parts.join(" · "),
  };
}

// Загружает setup_schema агента и (опц.) расшифрованный config подписки,
// возвращает результат проверки. Если у агента пустая схема — всё ОК.
// Если у подписки нет сохранённого config (jsonb пуст) — считаем все
// required поля пропущенными.
export async function validateSubscriptionConfig(
  subscriptionId: string,
  configOverride?: Record<string, string>,
): Promise<ConfigValidationResult> {
  const [sub] = await db
    .select({ agentId: subscriptions.agentId, config: subscriptions.config })
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (!sub) {
    return { ok: false, missing: [], invalid: ["подписка не найдена"], message: "подписка не найдена" };
  }

  const [agent] = await db
    .select({ setupSchema: agents.setupSchema })
    .from(agents)
    .where(eq(agents.id, sub.agentId))
    .limit(1);

  const schema = (agent?.setupSchema as SetupField[] | null) ?? [];
  if (!schema.length) return { ok: true };

  let config: Record<string, string> = {};
  if (configOverride) {
    config = configOverride;
  } else if (sub.config && typeof sub.config === "object") {
    for (const [k, v] of Object.entries(sub.config as Record<string, string>)) {
      try {
        config[k] = decrypt(v);
      } catch {
        config[k] = "";
      }
    }
  }

  return validateConfigAgainstSchema(schema, config);
}
