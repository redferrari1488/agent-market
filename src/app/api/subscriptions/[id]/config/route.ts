import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { encrypt } from "@/lib/encryption";
import { subscriptionConfigSchema } from "@/lib/validators";
import { deployContainer } from "@/lib/docker";
import { logger } from "@/lib/logger";

type SetupField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "select" | "json_array";
  options?: string[];
  required?: boolean;
};

// Серверная валидация config против setup_schema агента. Защита от ситуаций,
// когда фронт пропустил неполный конфиг — иначе контейнер деплоится и падает
// в restart loop с сырым Python traceback ("RSS_FEEDS must be non-empty JSON array").
function validateAgainstSchema(
  schema: SetupField[],
  config: Record<string, string>,
): { missing: string[]; invalid: string[] } {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const field of schema) {
    if (field.required === false) continue;
    const value = (config[field.key] ?? "").trim();

    if (!value) {
      missing.push(field.label);
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

  return { missing, invalid };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = subscriptionConfigSchema.safeParse(body.config);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", code: 400 },
        { status: 400 },
      );
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [sub] = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        status: subscriptions.status,
        agentId: subscriptions.agentId,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
    }

    // Тянем setup_schema чтобы провалидировать config до деплоя контейнера.
    const [agent] = await db
      .select({ setupSchema: agents.setupSchema })
      .from(agents)
      .where(eq(agents.id, sub.agentId))
      .limit(1);

    const schema = ((agent?.setupSchema as SetupField[]) || []).filter(
      (f): f is SetupField => Boolean(f && f.key),
    );

    const { missing, invalid } = validateAgainstSchema(schema, parsed.data);
    if (missing.length || invalid.length) {
      const parts: string[] = [];
      if (missing.length) parts.push(`Заполни: ${missing.join(", ")}`);
      if (invalid.length) parts.push(invalid.join("; "));
      return NextResponse.json(
        { error: parts.join(" · "), missing, invalid, code: 400 },
        { status: 400 },
      );
    }

    const encryptedConfig: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      encryptedConfig[key] = encrypt(value);
    }

    await db
      .update(subscriptions)
      .set({ config: encryptedConfig })
      .where(eq(subscriptions.id, id));

    try {
      await deployContainer(id);
    } catch (err) {
      logger.error({ err, subscriptionId: id }, "config: deploy failed");
      const message = err instanceof Error ? err.message : "Ошибка запуска контейнера";
      return NextResponse.json(
        { error: `Конфиг сохранён, но не удалось запустить контейнер: ${message}`, code: 500 },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    logger.error({ err: error }, "config route error");
    return NextResponse.json(
      { error: "Ошибка сервера", code: 500 },
      { status: 500 },
    );
  }
}
