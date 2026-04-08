import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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

    const [subsData] = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${subscriptions.amount}), 0)`,
      })
      .from(subscriptions);

    const [activeSubs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    const totalRevenue = subsData?.revenue || 0;

    return NextResponse.json({
      data: {
        users: usersCount?.count || 0,
        sellers: sellersCount?.count || 0,
        agents: agentsTotal?.count || 0,
        agentsPublished: agentsPublished?.count || 0,
        agentsReview: agentsReview?.count || 0,
        subscriptions: subsData?.count || 0,
        activeSubscriptions: activeSubs?.count || 0,
        totalRevenue,
        platformCommission: Math.floor(totalRevenue * 0.15),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
