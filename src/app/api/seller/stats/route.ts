import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, subscriptions, profiles, payouts } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { sellerPayout } from "@/lib/compute";
import { addMoney, type MoneyByCurrency } from "@/lib/money";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile || profile.role !== "seller") {
      return NextResponse.json({ error: "Только для продавцов", code: 403 }, { status: 403 });
    }

    // Агенты продавца
    const sellerAgents = await db
      .select({ id: agents.id, status: agents.status })
      .from(agents)
      .where(eq(agents.sellerId, user.id));

    const agentIds = sellerAgents.map((a) => a.id);

    const totalAgents = sellerAgents.length;
    const publishedAgents = sellerAgents.filter((a) => a.status === "published").length;
    const draftAgents = sellerAgents.filter((a) => a.status === "draft").length;
    const reviewAgents = sellerAgents.filter((a) => a.status === "review").length;

    // Подписки / покупки
    let totalSubs = 0;
    let activeSubs = 0;
    let totalRevenue: MoneyByCurrency = {};
    let sellerRevenue: MoneyByCurrency = {};

    if (agentIds.length > 0) {
      // JOIN с agents чтобы знать seller_price отдельно от compute_price.
      // totalRevenue = то, что платит покупатель (включая хостинг).
      // sellerRevenue = 88% ТОЛЬКО от seller_price, compute — passthrough.
      const subsRows = await db
        .select({
          status: subscriptions.status,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
          sellerPrice: subscriptions.sellerPrice,
          purchaseType: subscriptions.purchaseType,
          agentPriceMonthly: agents.priceMonthly,
          agentPriceOnetime: agents.priceOnetime,
        })
        .from(subscriptions)
        .leftJoin(agents, eq(subscriptions.agentId, agents.id))
        .where(inArray(subscriptions.agentId, agentIds));

      totalSubs = subsRows.length;
      activeSubs = subsRows.filter((s) => s.status === "active" || s.status === "pending_setup").length;
      totalRevenue = subsRows.reduce(
        (sum, s) => addMoney(sum, s.currency, s.amount || 0),
        {} as MoneyByCurrency,
      );
      sellerRevenue = subsRows.reduce((sum, s) => {
        const sellerPrice = s.sellerPrice ?? (
          s.purchaseType === "subscription" ? s.agentPriceMonthly : s.agentPriceOnetime
        );
        return sellerPrice != null
          ? addMoney(sum, s.currency, sellerPayout(sellerPrice))
          : sum;
      }, {} as MoneyByCurrency);
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
        sellerRevenue,      // 88% от seller_price — сколько реально получит продавец
        totalPaidOut,
      },
    });
  } catch (error) {
    console.error("Seller stats error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
