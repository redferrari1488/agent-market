import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { getProvider } from "@/lib/payments";

// Webhook от YooKassa. Вызывается самим YooKassa-ом после событий
// payment.succeeded / payment.canceled. Настройка URL в личном кабинете
// магазина: {NEXT_PUBLIC_APP_URL}/api/webhooks/yookassa

export async function POST(req: Request) {
  try {
    const provider = getProvider("yookassa");
    if (!provider) {
      // credentials не сконфигурированы — вебхук не должен вызываться,
      // но если всё же пришёл — отвечаем 503.
      return NextResponse.json({ error: "provider not configured" }, { status: 503 });
    }

    const rawBody = await req.text();
    const event = await provider.handleWebhook(rawBody, req.headers);

    if (event.type === "ignored") {
      return NextResponse.json({ ok: true, ignored: event.reason });
    }

    if (event.type === "payment.succeeded") {
      const [sub] = await db
        .select({
          purchaseType: subscriptions.purchaseType,
          expiresAt: subscriptions.expiresAt,
          providerPaymentId: subscriptions.providerPaymentId,
        })
        .from(subscriptions)
        .where(eq(subscriptions.id, event.subscriptionId))
        .limit(1);

      if (!sub) {
        return NextResponse.json({ ok: true, warning: "subscription not found" });
      }

      const alreadyExtendedByCron =
        sub.providerPaymentId === event.providerPaymentId && sub.expiresAt != null;

      await db
        .update(subscriptions)
        .set({
          status: "pending_setup",
          providerPaymentId: event.providerPaymentId,
          providerSubscriptionId: event.providerSubscriptionId ?? null,
          paymentProvider: "yookassa",
          amount: event.amount,
          currency: event.currency,
          ...(sub.purchaseType === "subscription" && !alreadyExtendedByCron
            ? { expiresAt: sql`now() + interval '1 month'` }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, event.subscriptionId));

      return NextResponse.json({ ok: true });
    }

    if (event.type === "payment.failed") {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(subscriptions.id, event.subscriptionId));

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("YooKassa webhook error:", error);
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}
