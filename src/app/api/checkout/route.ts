import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { getProvider, providerEnvConfigured } from "@/lib/payments";
import type { ProviderName } from "@/lib/payments";
import { resolveCheckoutPricing } from "@/lib/payments/pricing";
import { logger } from "@/lib/logger";

// Checkout. Схема работы:
//  1) провайдер передан и его credentials есть в env → настоящий checkout,
//     подписка создаётся со статусом pending (ожидание вебхука об оплате),
//     юзер редиректится на confirmation_url.
//  2) провайдер НЕ передан ИЛИ credentials отсутствуют (dev-режим) →
//     подписка создаётся сразу в pending_setup, юзер идёт в Setup Wizard.
//
// Это позволяет включить платежи простым добавлением env-переменных на VPS,
// без правок кода.

const checkoutSchema = z.object({
  agentId: z.string().uuid(),
  purchaseType: z.enum(["subscription", "one_time"]),
  provider: z.enum(["yookassa", "cryptomus"]).optional(),
  // Явный акцепт оферты + автосписаний (для подписок). Требование 161-ФЗ +
  // положение ЦБ 822-П: рекуррентные списания требуют отдельного согласия,
  // отличного от общего акцепта оферты.
  termsAccepted: z.literal(true),
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
      const issue = parsed.error.issues[0];
      if (issue?.path[0] === "termsAccepted") {
        return NextResponse.json(
          { error: "Необходимо согласие с офертой", code: 400 },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Некорректные данные", code: 400 }, { status: 400 });
    }
    const { agentId, purchaseType, provider: requestedProvider } = parsed.data;

    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);

    if (!agent || agent.status !== "published") {
      return NextResponse.json({ error: "Агент не найден", code: 404 }, { status: 404 });
    }

    // Phase 0: продаём только админских агентов (seller_id IS NULL).
    // Сторонние идут через outbound-ссылку (#4 в Phase 0). Это страховка от
    // ситуации, когда у продавца нет yookassa_account_id — split станет no-op
    // и его деньги осядут у платформы.
    if (agent.sellerId !== null) {
      return NextResponse.json(
        { error: "Покупка этого агента доступна напрямую у продавца", code: 503 },
        { status: 503 },
      );
    }

    if (purchaseType === "subscription" && !["subscription", "both"].includes(agent.pricingModel)) {
      return NextResponse.json({ error: "Подписка недоступна", code: 400 }, { status: 400 });
    }
    if (purchaseType === "one_time" && !["one_time", "both"].includes(agent.pricingModel)) {
      return NextResponse.json({ error: "Разовая покупка недоступна", code: 400 }, { status: 400 });
    }

    let checkoutPricing;
    try {
      checkoutPricing = resolveCheckoutPricing(agent, purchaseType, requestedProvider);
    } catch (error) {
      logger.error({ err: error, agentId: agent.id, purchaseType }, "checkout pricing error");
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
          inArray(subscriptions.status, ["pending_setup", "active", "paused"]),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ data: { subscriptionId: existing[0].id, reused: true } });
    }

    // ===== РЕЖИМ 1: настоящий платёжный провайдер =====
    const providerName: ProviderName | undefined =
      requestedProvider && providerEnvConfigured(requestedProvider) ? requestedProvider : undefined;

    if (providerName) {
      const provider = getProvider(providerName);
      if (!provider) {
        return NextResponse.json(
          { error: "Платёжный провайдер недоступен", code: 503 },
          { status: 503 },
        );
      }

      // Создаём подписку в статусе pending — вебхук переведёт её в pending_setup
      // после подтверждения оплаты.
      const [created] = await db
        .insert(subscriptions)
        .values({
          userId: user.id,
          agentId,
          purchaseType,
          paymentProvider: providerName,
          amount: checkoutPricing.totalMinor, // то, что реально списывается с покупателя
          sellerPrice: checkoutPricing.sellerPriceMinor,
          currency: checkoutPricing.currency,
          status: "pending_setup", // временно pending_setup — после вебхука ничего не меняем
        })
        .returning({ id: subscriptions.id });

      // Для yookassa — подкладываем yookassa_account_id продавца, если есть,
      // чтобы провайдер мог построить transfers[] для split-платежа.
      let agentForProvider = agent;
      if (agent.sellerId && providerName === "yookassa") {
        const [seller] = await db
          .select({ yookassaAccountId: profiles.yookassaAccountId })
          .from(profiles)
          .where(eq(profiles.id, agent.sellerId))
          .limit(1);
        if (seller?.yookassaAccountId) {
          agentForProvider = {
            ...agent,
            // Дополнительное поле читается внутри yookassa.ts через cast.
            sellerYookassaAccountId: seller.yookassaAccountId,
          } as typeof agent;
        }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
      const result = await provider.createCheckout({
        agent: agentForProvider,
        purchaseType,
        userId: user.id,
        subscriptionId: created.id,
        successUrl: `${appUrl}/dashboard/agents/${created.id}?checkout=success`,
        cancelUrl: `${appUrl}/agents/${agent.slug}?checkout=cancel`,
        currency: checkoutPricing.currency,
        sellerPriceMinor: checkoutPricing.sellerPriceMinor,
        computePriceMinor: checkoutPricing.computePriceMinor,
        totalMinor: checkoutPricing.totalMinor,
      });

      // provider_payment_id НЕ записываем — его выставит webhook при первом
      // payment.succeeded. Если записать здесь, idempotency-check в webhook
      // ошибочно посчитает первый webhook ретраем и не выставит expires_at.
      // Связь webhook ↔ subscription идёт через metadata.subscription_id.

      return NextResponse.json({
        data: {
          subscriptionId: created.id,
          checkoutUrl: result.checkoutUrl,
          reused: false,
        },
      });
    }

    // ===== РЕЖИМ 2: dev-stub (credentials провайдера отсутствуют) =====
    // Только в non-production окружении. В проде требуем настроенного провайдера,
    // чтобы исключить выпуск бесплатных подписок при misconfiguration.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Платёжный провайдер не настроен", code: 503 },
        { status: 503 },
      );
    }

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        agentId,
        purchaseType,
        paymentProvider: null,
        amount: checkoutPricing.totalMinor,
        sellerPrice: checkoutPricing.sellerPriceMinor,
        currency: checkoutPricing.currency,
        status: "pending_setup",
      })
      .returning({ id: subscriptions.id });

    return NextResponse.json({ data: { subscriptionId: created.id, reused: false } });
  } catch (error) {
    logger.error({ err: error }, "checkout error");
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
