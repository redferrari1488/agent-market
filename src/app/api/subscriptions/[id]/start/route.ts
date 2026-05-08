import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { deployContainer } from "@/lib/docker";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
  }

  const [sub] = await db
    .select({ id: subscriptions.id, status: subscriptions.status })
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
  }

  if (sub.status === "cancelled") {
    return NextResponse.json(
      { error: "Подписка отменена. Чтобы продолжить — оформите новую.", code: 409 },
      { status: 409 },
    );
  }

  try {
    const containerId = await deployContainer(id);
    await db
      .update(subscriptions)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(subscriptions.id, id));
    return NextResponse.json({ data: { ok: true, containerId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка запуска контейнера";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
