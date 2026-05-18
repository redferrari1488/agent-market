import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { restartContainer } from "@/lib/docker";
import { validateSubscriptionConfig } from "@/lib/agent-config-validation";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  // /restart допускаем только из active. Paused/expired/cancelled означают
  // что подписка не оплачена за текущий период — рестарт обошёл бы payment-gate.
  if (sub.status !== "active") {
    return NextResponse.json(
      { error: "Рестарт допустим только из активного состояния", code: 409 },
      { status: 409 },
    );
  }

  // Рестарт != бесплатный — он может пересоздать контейнер (deployContainer
  // в fallback). Если config битый, перезапускать смысла нет, лучше показать
  // юзеру какие поля поправить в Настройках.
  const validation = await validateSubscriptionConfig(id);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.message, missing: validation.missing, invalid: validation.invalid, code: 400 },
      { status: 400 },
    );
  }

  try {
    await restartContainer(id);
    await db
      .update(subscriptions)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(subscriptions.id, id));
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка рестарта контейнера";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
