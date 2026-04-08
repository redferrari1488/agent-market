import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { getContainerLogs, getContainerStatus } from "@/lib/docker";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
  }

  const [sub] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
  }

  const tail = Number(request.nextUrl.searchParams.get("tail") || "100");

  try {
    const [logs, status] = await Promise.all([
      getContainerLogs(id, Math.min(tail, 500)),
      getContainerStatus(id),
    ]);

    return NextResponse.json({ data: { logs, status } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка получения логов";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
