import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Только для админов", code: 403 }, { status: 403 });
    }

    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles);

    const [sellersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(eq(profiles.role, "seller"));

    const [agentsTotal] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agents);

    const [agentsPublished] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agents)
      .where(eq(agents.status, "published"));

    const [agentsReview] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agents)
      .where(eq(agents.status, "review"));

    // Для platformRevenue надо знать seller_price отдельно от total, поэтому
    // JOIN с agents. Admin-агенты (seller_id=NULL) — 100% total платформе.
    const subsRows = await db
      .select({
        status: subscriptions.status,
        amount: subscriptions.amount,
        currency: subscriptions.currency,
        sellerPrice: subscriptions.sellerPrice,
        purchaseType: subscriptions.purchaseType,
        agentSellerId: agents.sellerId,
        agentPriceMonthly: agents.priceMonthly,
        agentPriceOnetime: agents.priceOnetime,
      })
      .from(subscriptions)
      .leftJoin(agents, eq(subscriptions.agentId, agents.id));

    const totalRevenue = subsRows.reduce(
      (sum, s) => addMoney(sum, s.currency, s.amount || 0),
      {} as MoneyByCurrency,
    );
    const activeSubscriptions = subsRows.filter((s) => s.status === "active").length;

    // Что остаётся у платформы = total − sellerPayout(seller_price).
    // Для admin-агентов (seller_id=NULL) sellerPayout = 0 → вся сумма платформе.
    const platformRevenue = subsRows.reduce((sum, s) => {
      const amount = s.amount || 0;
      if (!s.agentSellerId) return addMoney(sum, s.currency, amount);
      const sellerPrice = s.sellerPrice ?? (
        s.purchaseType === "subscription" ? s.agentPriceMonthly : s.agentPriceOnetime
      );
      const sellerShare = sellerPrice != null ? sellerPayout(sellerPrice) : 0;
      return addMoney(sum, s.currency, amount - sellerShare);
    }, {} as MoneyByCurrency);

    return NextResponse.json({
      data: {
        users: usersCount?.count || 0,
        sellers: sellersCount?.count || 0,
        agents: agentsTotal?.count || 0,
        agentsPublished: agentsPublished?.count || 0,
        agentsReview: agentsReview?.count || 0,
        subscriptions: subsRows.length,
        activeSubscriptions,
        totalRevenue,       // сколько заплатили покупатели
        platformRevenue,    // хостинг (compute) + комиссия (на Phase 0 = 0) + 100% с admin-агентов
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
