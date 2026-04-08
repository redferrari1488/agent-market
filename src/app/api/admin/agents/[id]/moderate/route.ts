import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { moderateAgentSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const parsed = moderateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", code: 400 }, { status: 400 });
    }

    const [agent] = await db
      .select({ id: agents.id, status: agents.status })
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден", code: 404 }, { status: 404 });
    }

    const newStatus = parsed.data.action === "approve" ? "published" : "rejected";

    await db
      .update(agents)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(agents.id, id));

    return NextResponse.json({ data: { status: newStatus } });
  } catch (error) {
    console.error("Moderate agent error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
