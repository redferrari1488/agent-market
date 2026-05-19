import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { getContainerLogs, getContainerStatus } from "@/lib/docker";
import { apiServerError } from "@/lib/api-error";

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

  // Coerce + clamp: Number("foo") = NaN, Math.min(NaN, 500) = NaN → dockerode
  // получает NaN и поведение зависит от реализации. Принудительно держим в
  // [1, 500] с дефолтом 100.
  const rawTail = Number(request.nextUrl.searchParams.get("tail"));
  const tail = Number.isFinite(rawTail) && rawTail > 0
    ? Math.min(500, Math.floor(rawTail))
    : 100;

  try {
    const [logs, status] = await Promise.all([
      getContainerLogs(id, tail),
      getContainerStatus(id),
    ]);

    return NextResponse.json({ data: { logs, status } });
  } catch (err) {
    return apiServerError(err, "logs route error", "Ошибка получения логов", 500, { subscriptionId: id });
  }
}
