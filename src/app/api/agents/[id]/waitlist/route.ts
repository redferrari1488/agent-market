import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, agentWaitlistSignups } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { notifyAdmin } from "@/lib/admin-notify";
import { apiServerError } from "@/lib/api-error";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

type Params = Promise<{ id: string }>;

export async function POST(req: Request, ctx: { params: Params }) {
  try {
    const { id: agentId } = await ctx.params;

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Введите корректный email" },
        { status: 400 },
      );
    }

    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        waitlistOnly: agents.waitlistOnly,
      })
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }
    if (!agent.waitlistOnly || agent.status !== "published") {
      return NextResponse.json(
        { error: "Запись недоступна" },
        { status: 400 },
      );
    }

    const user = await getUser().catch(() => null);

    // partial unique по (agent_id, lower(email)) гарантирует дедуп. ON CONFLICT
    // — тихо игнорируем повторную запись (UX: «уже записан, спасибо»).
    await db
      .insert(agentWaitlistSignups)
      .values({
        agentId,
        email: parsed.data.email,
        userId: user?.id ?? null,
      })
      .onConflictDoNothing();

    notifyAdmin({
      subject: `Waitlist: ${agent.name}`,
      text: `Новая запись в waitlist агента ${agent.name}\nemail: ${parsed.data.email}\nuser: ${user?.id ?? "anonymous"}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiServerError(err, "waitlist signup error", "Ошибка сервера", 500);
  }
}
