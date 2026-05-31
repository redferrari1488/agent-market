import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, sellerApplications } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Стать продавцом (buyer → seller). Требуется одобренная заявка
// в seller_applications. Раньше любой авторизованный юзер мог одним POST
// получить роль seller → доступ к POST /api/seller/agents → выкладывать
// произвольный docker_image. Теперь self-promotion возможна только после
// admin approve в /api/admin/sellers/onboarding/[id].
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const limited = applyRateLimit("seller-become", user.id, RATE_LIMITS.sellerBecome);
    if (limited) return limited;

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Профиль не найден", code: 404 }, { status: 404 });
    }

    if (profile.role === "seller" || profile.role === "admin") {
      return NextResponse.json({ data: { role: profile.role } });
    }

    const [approved] = await db
      .select({ id: sellerApplications.id })
      .from(sellerApplications)
      .where(and(
        eq(sellerApplications.userId, user.id),
        eq(sellerApplications.status, "approved"),
      ))
      .limit(1);

    if (!approved) {
      return NextResponse.json(
        { error: "Нужна одобренная заявка продавца. Подайте её через форму.", code: 403 },
        { status: 403 },
      );
    }

    await db
      .update(profiles)
      .set({ role: "seller", updatedAt: new Date() })
      .where(eq(profiles.id, user.id));

    return NextResponse.json({ data: { role: "seller" } });
  } catch (error) {
    logger.error({ err: error }, "become seller error");
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
