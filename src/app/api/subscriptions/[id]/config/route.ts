import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { encrypt } from "@/lib/encryption";
import { subscriptionConfigSchema } from "@/lib/validators";
import { deployContainer } from "@/lib/docker";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = subscriptionConfigSchema.safeParse(body.config);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", code: 400 },
        { status: 400 }
      );
    }

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    // Проверяем владение подпиской
    const [sub] = await db
      .select({ id: subscriptions.id, userId: subscriptions.userId, status: subscriptions.status })
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
    }

    // Шифруем каждое значение
    const encryptedConfig: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      encryptedConfig[key] = encrypt(value);
    }

    // Сохраняем config и сразу деплоим контейнер. UI-кнопка обещает «поднять
    // контейнер агента» одним кликом, а семантика paused зарезервирована для
    // (1) ручного стопа в ManageView и (2) рекуррент-фейлов в yookassa-recurring.
    await db
      .update(subscriptions)
      .set({ config: encryptedConfig })
      .where(eq(subscriptions.id, id));

    try {
      await deployContainer(id);
    } catch (err) {
      logger.error({ err, subscriptionId: id }, "config: deploy failed");
      // Статус не трогаем — остаётся pending_setup, юзер увидит ошибку
      // и сможет повторить save (форма сохраняет введённые значения).
      const message = err instanceof Error ? err.message : "Ошибка запуска контейнера";
      return NextResponse.json(
        { error: `Конфиг сохранён, но не удалось запустить контейнер: ${message}`, code: 500 },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Config route error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера", code: 500 },
      { status: 500 }
    );
  }
}
