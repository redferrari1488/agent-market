import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { stopContainer } from "@/lib/docker";
import { getProvider, type ProviderName } from "@/lib/payments";
import { logger } from "@/lib/logger";

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
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      paymentProvider: subscriptions.paymentProvider,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
  }

  if (sub.status === "cancelled") {
    return NextResponse.json({ data: { ok: true, idempotent: true } });
  }

  try {
    await stopContainer(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка остановки контейнера";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }

  // Best-effort: попросить провайдера прекратить рекуррент. Для YooKassa это
  // no-op (наш cron сам отфильтровывает status='cancelled'). Но если ошибка
  // придёт — её игнорируем, контейнер уже остановлен и БД ниже отметит cancel.
  if (sub.paymentProvider && sub.providerSubscriptionId) {
    const provider = getProvider(sub.paymentProvider as ProviderName);
    if (provider) {
      try {
        await provider.cancelSubscription(sub.providerSubscriptionId);
      } catch (err) {
        logger.warn(
          { err, subscriptionId: id, provider: sub.paymentProvider },
          "provider cancelSubscription failed",
        );
      }
    }
  }

  await db
    .update(subscriptions)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(subscriptions.id, id));

  return NextResponse.json({ data: { ok: true } });
}
