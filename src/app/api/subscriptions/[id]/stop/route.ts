import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";

// Заглушка Day 4. На Day 5 здесь будет stopContainer() из lib/docker.ts.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
  }

  await db
    .update(subscriptions)
    .set({ status: "paused" })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)));

  return NextResponse.json({ data: { ok: true } });
}
