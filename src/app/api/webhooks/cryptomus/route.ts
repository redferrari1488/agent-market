import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts } from "@/lib/db/schema";
import { getProvider } from "@/lib/payments";
import { sellerPayout } from "@/lib/compute";
import { logger } from "@/lib/logger";

// Webhook от Cryptomus. URL: {NEXT_PUBLIC_APP_URL}/api/webhooks/cryptomus
//
// После подтверждения оплаты (payment.succeeded) инициируем программный
// payout 88% продавцу — только с его части цены (seller_price), без compute.
// У Cryptomus нет нативного split.

export async function POST(req: Request) {
  try {
    const provider = getProvider("cryptomus");
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

      // Обновляем подписку. Если уже active — оставляем active (recurring extension),
      // только зачисляем payout и обновляем payment_id.
      const [sub] = await db
        .update(subscriptions)
        .set({
          status: existingSub.status === "active" ? "active" : "pending_setup",
          providerPaymentId: event.providerPaymentId,
          paymentProvider: "cryptomus",
          amount: event.amount,
          currency: event.currency,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, event.subscriptionId))
        .returning();

      if (!sub) {
        return NextResponse.json({ ok: true, warning: "subscription not found" });
      }

      // Модель B+C: payout 88% продавцу только с его части цены (seller_price).
      // seller_price = price_monthly или price_onetime агента (compute туда не входит).
      const [agent] = await db.select().from(agents).where(eq(agents.id, sub.agentId)).limit(1);
      if (agent?.sellerId) {
        const [seller] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, agent.sellerId))
          .limit(1);

        // Приоритет — snapshot на момент checkout. Fallback на текущую цену агента,
        // если snapshot отсутствует (старые подписки до миграции).
        const agentSellerPrice = sub.sellerPrice ?? (
          sub.purchaseType === "subscription" ? agent.priceMonthly : agent.priceOnetime
        );
        const sellerShare = agentSellerPrice != null ? sellerPayout(agentSellerPrice) : 0;

        if (seller?.cryptomusWalletAddress && sellerShare > 0) {
          try {
            const payoutResult = await provider.payoutToSeller({
              sellerId: seller.id,
              amount: sellerShare,
              currency: event.currency,
              sellerWalletOrAccount: seller.cryptomusWalletAddress,
              reference: sub.id,
            });

            await db.insert(payouts).values({
              sellerId: seller.id,
              paymentProvider: "cryptomus",
              subscriptionId: sub.id,
              amount: sellerShare,
              currency: event.currency,
              providerTransferId: payoutResult.providerTransferId,
              status: payoutResult.status,
            });
          } catch (payoutError) {
            // Payout упал — логируем, но подписку не откатываем.
            // Фиксируем долг платформы перед продавцом; ретраим вручную/cron.
            logger.error(
              { err: payoutError, sellerId: seller.id, subscriptionId: sub.id },
              "cryptomus payout failed",
            );
            await db.insert(payouts).values({
              sellerId: seller.id,
              paymentProvider: "cryptomus",
              subscriptionId: sub.id,
              amount: sellerShare,
              currency: event.currency,
              lastError: String(payoutError),
              status: "failed",
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
    logger.error({ err: error }, "cryptomus webhook error");
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}
