import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, subscriptions, agents } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { reviewSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Auth первым, до парсинга body — иначе анонимному вызывающему легко
    // прощупать схему body (какие поля принимаем, какие требуются).
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", code: 400 },
        { status: 400 }
      );
    }

    // Проверяем, что у юзера есть покупка этого агента
    const [sub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.agentId, agentId),
          inArray(subscriptions.status, ["pending_setup", "active", "paused", "expired"])
        )
      )
      .limit(1);

    if (!sub) {
      return NextResponse.json(
        { error: "Отзыв можно оставить только после покупки", code: 403 },
        { status: 403 }
      );
    }

    // Upsert отзыва
    await db
      .insert(reviews)
      .values({
        userId: user.id,
        agentId,
        subscriptionId: sub.id,
        rating: parsed.data.rating,
        text: parsed.data.text || null,
      })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.agentId],
        set: {
          rating: parsed.data.rating,
          text: parsed.data.text || null,
          subscriptionId: sub.id,
        },
      });

    // Пересчитываем рейтинг
    const allReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.agentId, agentId));

    if (allReviews.length > 0) {
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = sum / allReviews.length;
      await db
        .update(agents)
        .set({ ratingAvg: avgRating, ratingCount: allReviews.length })
        .where(eq(agents.id, agentId));
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Review route error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
