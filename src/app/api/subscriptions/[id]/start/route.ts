import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { deployContainer } from "@/lib/docker";
import { validateSubscriptionConfig } from "@/lib/agent-config-validation";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
  }

  const [sub] = await db
    .select({ id: subscriptions.id, status: subscriptions.status })
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
  }

  // /start разрешён только в:
  //   - pending_setup — оплата прошла, ждём сохранение config + initial deploy
  //   - active        — idempotent restart уже работающего контейнера
  // Paused/expired/cancelled НЕ запускаем — паузу делает cron после 3 failed
  // recurring charges, expired = срок истёк. Запуск отсюда обошёл бы payment-gate.
  if (sub.status === "cancelled") {
    return NextResponse.json(
      { error: "Подписка отменена. Чтобы продолжить — оформите новую.", code: 409 },
      { status: 409 },
    );
  }
  if (sub.status === "paused") {
    return NextResponse.json(
      { error: "Подписка приостановлена из-за неудачных списаний. Возобновите оплату.", code: 409 },
      { status: 409 },
    );
  }
  if (sub.status === "expired") {
    return NextResponse.json(
      { error: "Срок подписки истёк. Продлите оплату.", code: 409 },
      { status: 409 },
    );
  }
  if (sub.status !== "pending_setup" && sub.status !== "active") {
    return NextResponse.json(
      { error: "Запуск из этого состояния не допускается", code: 409 },
      { status: 409 },
    );
  }

  // Перед deploy всегда сверяем сохранённый config с setup_schema. Без этого
  // /start превращался в дыру: можно было дёрнуть его до сохранения настроек
  // и контейнер запустился бы с пустым env → restart loop.
  const validation = await validateSubscriptionConfig(id);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.message, missing: validation.missing, invalid: validation.invalid, code: 400 },
      { status: 400 },
    );
  }

  try {
    const containerId = await deployContainer(id);
    await db
      .update(subscriptions)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(subscriptions.id, id));
    return NextResponse.json({ data: { ok: true, containerId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка запуска контейнера";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
