import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { encrypt } from "@/lib/encryption";
import { subscriptionConfigSchema } from "@/lib/validators";
import { deployContainer } from "@/lib/docker";
import { logger } from "@/lib/logger";
import { validateSubscriptionConfig } from "@/lib/agent-config-validation";

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
      .select({ id: subscriptions.id, userId: subscriptions.userId })
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
    }

    // Серверная валидация config против setup_schema агента до деплоя
    // контейнера — защищает от ситуаций, где фронт пропустил неполный конфиг.
    const validation = await validateSubscriptionConfig(id, parsed.data);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.message, missing: validation.missing, invalid: validation.invalid, code: 400 },
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
