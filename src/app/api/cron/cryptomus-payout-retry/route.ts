import { NextResponse } from "next/server";
import { and, eq, gte, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { payouts, profiles, subscriptions } from "@/lib/db/schema";
import { getProvider } from "@/lib/payments";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const provider = getProvider("cryptomus");
  if (!provider) {
    return NextResponse.json({ error: "provider not configured" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: payouts.id,
      sellerId: payouts.sellerId,
      subscriptionId: payouts.subscriptionId,
      amount: payouts.amount,
      currency: payouts.currency,
      retryCount: payouts.retryCount,
      sellerWallet: profiles.cryptomusWalletAddress,
      subscriptionRef: subscriptions.id,
    })
    .from(payouts)
    .leftJoin(profiles, eq(payouts.sellerId, profiles.id))
    .leftJoin(subscriptions, eq(payouts.subscriptionId, subscriptions.id))
    .where(and(
      eq(payouts.paymentProvider, "cryptomus"),
      eq(payouts.status, "failed"),
      lt(payouts.retryCount, 5),
      gte(payouts.createdAt, cutoff),
      isNotNull(payouts.subscriptionId),
    ))
    .limit(20);

  let recovered = 0;

  for (const row of rows) {
    const nextRetryCount = row.retryCount + 1;

    try {
      if (!row.subscriptionId || !row.subscriptionRef) {
        throw new Error("subscription not found");
      }

      if (!row.sellerWallet) {
        throw new Error("seller wallet is not configured");
      }

      const payoutResult = await provider.payoutToSeller({
        sellerId: row.sellerId,
        amount: row.amount,
        currency: row.currency ?? "RUB",
        sellerWalletOrAccount: row.sellerWallet,
        reference: row.subscriptionId,
      });

      recovered += 1;
      await db
        .update(payouts)
        .set({
          status: payoutResult.status,
          providerTransferId: payoutResult.providerTransferId,
          retryCount: nextRetryCount,
          lastError: null,
        })
        .where(eq(payouts.id, row.id));
    } catch (error) {
      await db
        .update(payouts)
        .set({
          retryCount: nextRetryCount,
          lastError: error instanceof Error ? error.message : String(error),
          status: "failed",
        })
        .where(eq(payouts.id, row.id));
    }
  }

  return NextResponse.json({
    retried: rows.length,
    recovered,
  });
}
