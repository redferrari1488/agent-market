import { NextResponse } from "next/server";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentLogs, agents, profiles, subscriptions } from "@/lib/db/schema";
import { sellerPayout } from "@/lib/compute";
import { chargeRecurringYooKassa } from "@/lib/payments/yookassa";

const RECURRING_FAILURES_KEY = "_meta_recurring_failures";
const LEGACY_RECURRING_FAILURES_KEY = "recurring_failures";

function getRecurringFailures(config: unknown): number {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return 0;
  }

  const record = config as Record<string, unknown>;
  const raw = record[RECURRING_FAILURES_KEY] ?? record[LEGACY_RECURRING_FAILURES_KEY];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function withRecurringFailures(config: unknown, count: number) {
  const base =
    config && typeof config === "object" && !Array.isArray(config)
      ? (config as Record<string, unknown>)
      : {};
  const { [LEGACY_RECURRING_FAILURES_KEY]: _legacyRecurringFailures, ...rest } = base;

  return {
    ...rest,
    [RECURRING_FAILURES_KEY]: String(count),
  };
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const now = new Date();
  // Окно [-24h, +24h]. Нижняя граница — backfill: если предыдущий запуск
  // пропущен (downtime > Persistent=true / network / провайдер), подписки,
  // чей expiresAt уже в прошлом, всё равно попадут в выборку.
  // Безопасно, потому что Idempotence-Key в chargeRecurringYooKassa дневной
  // (`recurring:<sub>:<utc_day>`), повторный вызов в тот же UTC-день не
  // создаёт дубликат платежа.
  const prevDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: subscriptions.id,
      amount: subscriptions.amount,
      sellerPrice: subscriptions.sellerPrice,
      config: subscriptions.config,
      expiresAt: subscriptions.expiresAt,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
      agentName: agents.name,
      agentPriceMonthly: agents.priceMonthly,
      agentComputeClass: agents.computeClass,
      sellerId: agents.sellerId,
      sellerYookassaAccountId: profiles.yookassaAccountId,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .leftJoin(profiles, eq(agents.sellerId, profiles.id))
    .where(and(
      eq(subscriptions.paymentProvider, "yookassa"),
      eq(subscriptions.status, "active"),
      eq(subscriptions.purchaseType, "subscription"),
      isNotNull(subscriptions.providerSubscriptionId),
      isNotNull(subscriptions.expiresAt),
      gte(subscriptions.expiresAt, prevDay),
      lte(subscriptions.expiresAt, nextDay),
    ))
    .limit(100);

  let succeeded = 0;
  let failed = 0;

  for (const row of rows) {
    const sellerPrice = row.sellerPrice ?? row.agentPriceMonthly ?? 0;
    const amountKopecks = row.amount ?? sellerPrice;
    const sellerShareKopecks =
      row.sellerId && sellerPrice > 0 ? sellerPayout(sellerPrice) : undefined;

    try {
      const result = await chargeRecurringYooKassa({
        paymentMethodId: row.providerSubscriptionId!,
        amountMinor: amountKopecks,
        subscriptionId: row.id,
        description: `${row.agentName} (recurring)`,
        sellerAccountId: row.sellerYookassaAccountId ?? undefined,
        sellerShareMinor: sellerShareKopecks,
      });

      if (result.status === "succeeded") {
        succeeded += 1;
        await db
          .update(subscriptions)
          .set({
            providerPaymentId: result.providerPaymentId,
            expiresAt: sql`${subscriptions.expiresAt} + interval '1 month'`,
            config: withRecurringFailures(row.config, 0),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, row.id));
        continue;
      }

      if (result.status === "pending") {
        await db
          .update(subscriptions)
          .set({
            providerPaymentId: result.providerPaymentId,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, row.id));
        continue;
      }

      const nextFailures = getRecurringFailures(row.config) + 1;
      failed += 1;

      await db.insert(agentLogs).values({
        subscriptionId: row.id,
        level: "warn",
        message: `Recurring YooKassa charge failed with status ${result.status}`,
      });

      await db
        .update(subscriptions)
        .set({
          providerPaymentId: result.providerPaymentId,
          config: withRecurringFailures(row.config, nextFailures),
          ...(nextFailures >= 3 ? { status: "paused" } : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, row.id));
    } catch (error) {
      const nextFailures = getRecurringFailures(row.config) + 1;
      failed += 1;

      await db.insert(agentLogs).values({
        subscriptionId: row.id,
        level: "warn",
        message: `Recurring YooKassa charge failed: ${error instanceof Error ? error.message : String(error)}`,
      });

      await db
        .update(subscriptions)
        .set({
          config: withRecurringFailures(row.config, nextFailures),
          ...(nextFailures >= 3 ? { status: "paused" } : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, row.id));
    }
  }

  return NextResponse.json({
    processed: rows.length,
    succeeded,
    failed,
  });
}
