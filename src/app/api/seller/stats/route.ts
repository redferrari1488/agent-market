import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, subscriptions, profiles, payouts } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";

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
    let totalRevenue = 0;

    if (agentIds.length > 0) {
      const subsRows = await db
        .select({
          status: subscriptions.status,
          amount: subscriptions.amount,
        })
        .from(subscriptions)
        .where(inArray(subscriptions.agentId, agentIds));

      totalSubs = subsRows.length;
      activeSubs = subsRows.filter((s) => s.status === "active" || s.status === "pending_setup").length;
      totalRevenue = subsRows.reduce((sum, s) => sum + (s.amount || 0), 0);
    }

    // Выплаты
    const payoutRows = await db
      .select({
        total: sql<number>`coalesce(sum(${payouts.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(payouts)
      .where(and(eq(payouts.sellerId, user.id), eq(payouts.status, "completed")));

    const totalPaidOut = payoutRows[0]?.total || 0;

    return NextResponse.json({
      data: {
        totalAgents,
        publishedAgents,
        draftAgents,
        reviewAgents,
        totalSubs,
        activeSubs,
        totalRevenue,       // в копейках, вся сумма (до вычета комиссии)
        sellerRevenue: Math.floor(totalRevenue * 0.85), // 85% после комиссии
        totalPaidOut,
      },
    });
  } catch (error) {
    console.error("Seller stats error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
