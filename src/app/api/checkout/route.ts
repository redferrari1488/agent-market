import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, subscriptions } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";

// Dev checkout — создаёт подписку в статусе pending_setup без реальной оплаты.
// Временная заглушка до интеграции YooKassa + Cryptomus.
// Why: разблокирует тестирование Setup Wizard → deploy → logs без ожидания платёжки.

const checkoutSchema = z.object({
  agentId: z.string().uuid(),
  purchaseType: z.enum(["subscription", "one_time"]),
});

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные", code: 400 }, { status: 400 });
    }
    const { agentId, purchaseType } = parsed.data;

    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent || agent.status !== "published") {
      return NextResponse.json({ error: "Агент не найден", code: 404 }, { status: 404 });
    }

    // Проверяем, что выбранный тариф поддерживается агентом
    if (purchaseType === "subscription" && !["subscription", "both"].includes(agent.pricingModel)) {
      return NextResponse.json({ error: "Подписка недоступна", code: 400 }, { status: 400 });
    }
    if (purchaseType === "one_time" && !["one_time", "both"].includes(agent.pricingModel)) {
      return NextResponse.json({ error: "Разовая покупка недоступна", code: 400 }, { status: 400 });
    }

    const amount = purchaseType === "subscription" ? agent.priceMonthly : agent.priceOnetime;
    if (amount == null) {
      return NextResponse.json({ error: "Цена не указана", code: 400 }, { status: 400 });
    }

    // Нет ли уже активной/настраиваемой подписки на того же агента
    const existing = await db
      .select({ id: subscriptions.id, status: subscriptions.status })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.agentId, agentId),
          inArray(subscriptions.status, ["pending_setup", "active", "paused"])
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ data: { subscriptionId: existing[0].id, reused: true } });
    }

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        agentId,
        purchaseType,
        paymentProvider: null,
        amount,
        currency: "RUB",
        status: "pending_setup",
      })
      .returning({ id: subscriptions.id });

    return NextResponse.json({ data: { subscriptionId: created.id, reused: false } });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
