import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts } from "@/lib/db/schema";
import { getProvider } from "@/lib/payments";
import { sellerPayout } from "@/lib/compute";

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
      // Обновляем подписку.
      const [sub] = await db
        .update(subscriptions)
        .set({
          status: "pending_setup",
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

        const agentSellerPrice =
          sub.purchaseType === "subscription" ? agent.priceMonthly : agent.priceOnetime;
        const sellerShare = agentSellerPrice != null ? sellerPayout(agentSellerPrice) : 0;

        if (seller?.cryptmusWalletAddress && sellerShare > 0) {
          try {
            const payoutResult = await provider.payoutToSeller({
              sellerId: seller.id,
              amount: sellerShare,
              currency: "RUB",
              sellerWalletOrAccount: seller.cryptmusWalletAddress,
              reference: sub.id,
            });

            await db.insert(payouts).values({
              sellerId: seller.id,
              paymentProvider: "cryptomus",
              amount: sellerShare,
              currency: "RUB",
              providerTransferId: payoutResult.providerTransferId,
              status: payoutResult.status,
            });
          } catch (payoutError) {
            // Payout упал — логируем, но подписку не откатываем.
            // Фиксируем долг платформы перед продавцом; ретраим вручную/cron.
            console.error("Cryptomus payout failed:", payoutError);
            await db.insert(payouts).values({
              sellerId: seller.id,
              paymentProvider: "cryptomus",
              amount: sellerShare,
              currency: "RUB",
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
    console.error("Cryptomus webhook error:", error);
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}
