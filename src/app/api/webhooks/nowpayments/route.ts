import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts } from "@/lib/db/schema";
import { getProvider } from "@/lib/payments";
import { sellerPayout } from "@/lib/compute";
import { logger } from "@/lib/logger";

// Webhook от NowPayments. URL: {NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments
//
// NowPayments не имеет нативного split — все деньги идут платформе. Mass payout
// требует JWT+2FA, поэтому в Phase 0 payout стаб бросает not-implemented,
// здесь мы ловим это и пишем запись payouts.status='pending' для последующей
// ручной выплаты админом. Когда сторонних продавцов > 0 — реализуем auto-payout.

export async function POST(req: Request) {
  try {
    const provider = getProvider("nowpayments");
    if (!provider) {
      return NextResponse.json({ error: "provider not configured" }, { status: 503 });
    }

    const rawBody = await req.text();
    const event = await provider.handleWebhook(rawBody, req.headers);

    if (event.type === "ignored") {
      return NextResponse.json({ ok: true, ignored: event.reason });
    }

    if (event.type === "payment.succeeded") {
      // Idempotency: если этот же payment_id уже зафиксирован — webhook ретрай,
      // выходим без побочных эффектов (иначе создадим дубликат payouts).
      const [existingSub] = await db
        .select({
          id: subscriptions.id,
          providerPaymentId: subscriptions.providerPaymentId,
          status: subscriptions.status,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
        })
        .from(subscriptions)
        .where(eq(subscriptions.id, event.subscriptionId))
        .limit(1);

      if (!existingSub) {
        return NextResponse.json({ ok: true, warning: "subscription not found" });
      }

      if (existingSub.providerPaymentId === event.providerPaymentId) {
        return NextResponse.json({ ok: true, idempotent: true });
      }

      // Amount/currency tampering guard. checkout/route.ts фиксирует ожидаемые
      // amount + currency в момент создания подписки. Если IPN HMAC скомпро-
      // метирован (или провайдер ретраит с partial-paid), event может прийти
      // с заниженной суммой — НЕ активируем подписку и НЕ создаём payout.
      if (existingSub.amount != null && event.amount !== existingSub.amount) {
        logger.error(
          { subscriptionId: event.subscriptionId, expected: existingSub.amount, got: event.amount },
          "nowpayments webhook: amount mismatch",
        );
        return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
      }
      if (existingSub.currency != null && event.currency !== existingSub.currency) {
        logger.error(
          { subscriptionId: event.subscriptionId, expected: existingSub.currency, got: event.currency },
          "nowpayments webhook: currency mismatch",
        );
        return NextResponse.json({ error: "currency mismatch" }, { status: 400 });
      }

      const [sub] = await db
        .update(subscriptions)
        .set({
          status: existingSub.status === "active" ? "active" : "pending_setup",
          providerPaymentId: event.providerPaymentId,
          paymentProvider: "nowpayments",
          amount: event.amount,
          currency: event.currency,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, event.subscriptionId))
        .returning();

      if (!sub) {
        return NextResponse.json({ ok: true, warning: "subscription not found" });
      }

      // Payout продавцу — Phase 0 stub: реальной выплаты не делаем, но пишем
      // запись payouts.status='pending', чтобы админ видел кому выплатить.
      const [agent] = await db.select().from(agents).where(eq(agents.id, sub.agentId)).limit(1);
      if (agent?.sellerId) {
        const [seller] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, agent.sellerId))
          .limit(1);

        const agentSellerPrice = sub.sellerPrice ?? (
          sub.purchaseType === "subscription" ? agent.priceMonthly : agent.priceOnetime
        );
        const sellerShare = agentSellerPrice != null ? sellerPayout(agentSellerPrice) : 0;

        const wallets = seller?.cryptoWallets ?? null;
        const hasWallet = Boolean(
          wallets && (wallets.usdt_trc20 || wallets.usdc_sol || wallets.btc),
        );

        if (hasWallet && sellerShare > 0) {
          // Идемпотентность payout: НЕ создавать дубль если для этой
          // подписки + payment_id уже есть pending. Раньше late retry на
          // старый payment_id (после нескольких ренюалов) мог сгенерить
          // повторный payout. Используем providerTransferId как маркер
          // payment_id — поле остаётся nullable до реальной выплаты, его
          // mож переиспользовать без миграции.
          const transferMarker = `nowpayments:${event.providerPaymentId}`;
          const [duplicate] = await db
            .select({ id: payouts.id })
            .from(payouts)
            .where(and(
              eq(payouts.subscriptionId, sub.id),
              eq(payouts.providerTransferId, transferMarker),
            ))
            .limit(1);

          if (!duplicate) {
            await db.insert(payouts).values({
              sellerId: seller!.id,
              paymentProvider: "nowpayments",
              subscriptionId: sub.id,
              amount: sellerShare,
              currency: event.currency,
              status: "pending",
              providerTransferId: transferMarker,
              lastError: "manual nowpayments payout required (Phase 0)",
            });
          }
        }
      }

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
    logger.error({ err: error }, "nowpayments webhook error");
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}
