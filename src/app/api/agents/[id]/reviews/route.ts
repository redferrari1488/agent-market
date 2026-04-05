import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { reviewSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", code: 400 },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    // Проверяем, что у юзера есть покупка этого агента
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("agent_id", agentId)
      .in("status", ["pending_setup", "active", "paused", "expired"])
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: "Отзыв можно оставить только после покупки", code: 403 },
        { status: 403 }
      );
    }

    // Upsert отзыва (UNIQUE(user_id, agent_id) в БД)
    const { error: upsertError } = await supabase.from("reviews").upsert(
      {
        user_id: user.id,
        agent_id: agentId,
        subscription_id: sub.id,
        rating: parsed.data.rating,
        text: parsed.data.text || null,
      },
      { onConflict: "user_id,agent_id" }
    );

    if (upsertError) {
      console.error("Review upsert error:", upsertError);
      return NextResponse.json(
        { error: "Ошибка сохранения отзыва", code: 500 },
        { status: 500 }
      );
    }

    // Пересчитываем rating_avg и rating_count
    const { data: stats } = await supabase
      .from("reviews")
      .select("rating")
      .eq("agent_id", agentId);

    if (stats && stats.length > 0) {
      const sum = stats.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / stats.length;
      await supabase
        .from("agents")
        .update({ rating_avg: avg, rating_count: stats.length })
        .eq("id", agentId);
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Review route error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
