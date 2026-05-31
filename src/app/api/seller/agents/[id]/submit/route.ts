import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { logger } from "@/lib/logger";

// Отправить агента на модерацию (draft → review)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [agent] = await db
      .select({ id: agents.id, status: agents.status })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.sellerId, user.id)))
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден", code: 404 }, { status: 404 });
    }

    if (agent.status !== "draft" && agent.status !== "rejected") {
      return NextResponse.json(
        { error: "Отправить на модерацию можно только черновик или отклонённого агента", code: 400 },
        { status: 400 }
      );
    }

    await db
      .update(agents)
      .set({ status: "review", updatedAt: new Date() })
      .where(eq(agents.id, id));

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    logger.error({ err: error }, "submit agent error");
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
