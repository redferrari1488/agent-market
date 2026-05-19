import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, subscriptions, profiles, payouts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { sellerPayout } from "@/lib/compute";
import { addMoney, type MoneyByCurrency } from "@/lib/money";
import { applyRateLimit } from "@/lib/rate-limit";
import { apiServerError } from "@/lib/api-error";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const limited = applyRateLimit("sellerStats", user.id, { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile || profile.role !== "seller") {
      return NextResponse.json({ error: "Только для продавцов", code: 403 }, { status: 403 });
    }

    // Один JOIN вместо двух последовательных запросов (агенты → подписки).
    // Раньше: SELECT agents → собираем ids → SELECT subscriptions WHERE agent_id IN (...).
    // Сейчас: LEFT JOIN — за один round-trip. Подписки без агентов фильтрует
    // WHERE на agents.seller_id, агенты без подписок остаются с NULL в полях
    // подписки и не учитываются в totals.
    const rows = await db
      .select({
        agentId: agents.id,
        agentStatus: agents.status,
        agentPriceMonthly: agents.priceMonthly,
        agentPriceOnetime: agents.priceOnetime,
        subStatus: subscriptions.status,
        subAmount: subscriptions.amount,
        subCurrency: subscriptions.currency,
        subSellerPrice: subscriptions.sellerPrice,
        subPurchaseType: subscriptions.purchaseType,
      })
      .from(agents)
      .leftJoin(subscriptions, eq(subscriptions.agentId, agents.id))
      .where(eq(agents.sellerId, user.id));

    // Дедуп по agentId для agent-counters.
    const seenAgents = new Set<string>();
    let totalAgents = 0;
    let publishedAgents = 0;
    let draftAgents = 0;
    let reviewAgents = 0;
    let totalSubs = 0;
    let activeSubs = 0;
    let totalRevenue: MoneyByCurrency = {};
    let sellerRevenue: MoneyByCurrency = {};

    for (const row of rows) {
      if (!seenAgents.has(row.agentId)) {
        seenAgents.add(row.agentId);
        totalAgents += 1;
        if (row.agentStatus === "published") publishedAgents += 1;
        else if (row.agentStatus === "draft") draftAgents += 1;
        else if (row.agentStatus === "review") reviewAgents += 1;
      }
      if (row.subStatus) {
        totalSubs += 1;
        if (row.subStatus === "active" || row.subStatus === "pending_setup") activeSubs += 1;
        totalRevenue = addMoney(totalRevenue, row.subCurrency, row.subAmount || 0);
        const sellerPrice = row.subSellerPrice ?? (
          row.subPurchaseType === "subscription" ? row.agentPriceMonthly : row.agentPriceOnetime
        );
        if (sellerPrice != null) {
          sellerRevenue = addMoney(sellerRevenue, row.subCurrency, sellerPayout(sellerPrice));
        }
      }
    }

    // Выплаты
    const payoutRows = await db
      .select({
        amount: payouts.amount,
        currency: payouts.currency,
      })
      .from(payouts)
      .where(and(eq(payouts.sellerId, user.id), eq(payouts.status, "completed")));

    const totalPaidOut = payoutRows.reduce(
      (sum, row) => addMoney(sum, row.currency, row.amount),
      {} as MoneyByCurrency,
    );

    return NextResponse.json({
      data: {
        totalAgents,
        publishedAgents,
        draftAgents,
        reviewAgents,
        totalSubs,
        activeSubs,
        totalRevenue,       // total (seller + compute) — сколько заплатили покупатели
        sellerRevenue,      // sellerPayout(seller_price) — сколько реально получит продавец
        totalPaidOut,
      },
    });
  } catch (error) {
    return apiServerError(error, "seller stats error", "Ошибка сервера", 500);
  }
}
