import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { and, eq, gte, inArray, isNotNull, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentLogs, agents, profiles, subscriptions } from "@/lib/db/schema";
import { sellerPayout } from "@/lib/compute";
import { chargeRecurringYooKassa, YookassaError } from "@/lib/payments/yookassa";
import { stopContainerRuntime } from "@/lib/docker";
import { EXPIRY_GRACE_DAYS, STOPPABLE_STATUSES } from "@/lib/subscriptions/reconcile";
import { alert } from "@/lib/alerter";

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
  if (!cronSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // timing-safe сравнение секрета. С `!==` можно было замерять разницу
  // времени отклика на длинных vs коротких префиксах правильного значения.
  const provided = req.headers.get("x-cron-secret") ?? "";
  const expected = Buffer.from(cronSecret);
  const got = Buffer.from(provided);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const now = new Date();
  // L25: zombie cleanup. Checkout создаёт subscription со status='pending_setup'
  // и пустым provider_payment_id; вебхук провайдера потом проставляет
  // payment_id. Если вебхук не пришёл за 24 часа — checkout прерван либо
  // провайдер не позвонил. Такие подписки висят, замусоривают БД и блокируют
  // повторный checkout (existing-check). Гасим как expired.
  const zombieCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const zombieResult = await db
    .update(subscriptions)
    .set({ status: "expired", updatedAt: now })
    .where(and(
      eq(subscriptions.status, "pending_setup"),
      isNull(subscriptions.providerPaymentId),
      lt(subscriptions.startedAt, zombieCutoff),
    ))
    .returning({ id: subscriptions.id });

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
      failed += 1;

      // M22: разделяем transient (5xx/timeout/429) от permanent (4xx).
      // Transient — копим счётчик, pause после 3 (защита от cascading).
      // Permanent (card declined, account suspended) — pause сразу: повторять
      // ту же ошибку 3 дня бесполезно и юзеру быстрее покажем «продлите оплату».
      const isYookassaErr = error instanceof YookassaError;
      const isTransient = !isYookassaErr || error.isTransient;

      const nextFailures = getRecurringFailures(row.config) + 1;
      const shouldPause = !isTransient || nextFailures >= 3;

      if (!isTransient) {
        alert({
          key: `recurring:permanent:${row.id}`,
          severity: "warn",
          title: "Recurring charge permanent-fail (subscription paused)",
          details: {
            subscriptionId: row.id,
            agent: row.agentName,
            err: error instanceof Error ? error.message : String(error),
          },
        });
      }

      await db.insert(agentLogs).values({
        subscriptionId: row.id,
        level: "warn",
        message: `Recurring YooKassa charge failed${isTransient ? " (transient)" : " (permanent)"}: ${error instanceof Error ? error.message : String(error)}`,
      });

      await db
        .update(subscriptions)
        .set({
          config: withRecurringFailures(row.config, nextFailures),
          ...(shouldPause ? { status: "paused" } : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, row.id));
    }
  }

  // ── Reconciler «биллинг ⇄ рантайм» (T4 аудита, закрывает H1) ──────────────
  // Инвариант: нет работающего контейнера без active-подписки. Запускается ПОСЛЕ
  // recurring-charge — чтобы только что продлённые подписки уже имели свежий
  // expires_at и не попали под expiry.

  // Фаза 1 — expiry: active-подписка, чей оплаченный срок истёк больше grace
  // назад. Реально под это попадают крипто-подписки (NowPayments без
  // авто-recurring — хвост H2) и те, чьё ЮКасса-продление окончательно
  // провалилось (recurring исчерпал ретраи). Зеркалит shouldMarkExpired().
  const expiryCutoff = new Date(now.getTime() - EXPIRY_GRACE_DAYS * 24 * 60 * 60 * 1000);
  const expiredResult = await db
    .update(subscriptions)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(
      eq(subscriptions.status, "active"),
      isNotNull(subscriptions.expiresAt),
      lt(subscriptions.expiresAt, expiryCutoff),
    ))
    .returning({ id: subscriptions.id });

  // Фаза 2 — стоп рантайма: подписка не active (paused за неуплату, expired по
  // сроку, cancelled юзером), но контейнер ещё привязан. Без этого агент
  // крутится бесплатно и жжёт платформенный OpenRouter-ключ (H1). Останавливаем
  // только docker-рантайм (status НЕ перетираем), volume НЕ трогаем — снос
  // данных cancelled это отдельное продуктовое решение (Open Q2). Зеркалит
  // shouldStopContainer().
  const toStop = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(
      inArray(subscriptions.status, [...STOPPABLE_STATUSES]),
      isNotNull(subscriptions.containerId),
    ))
    .limit(200);

  let containersStopped = 0;
  for (const s of toStop) {
    try {
      const wasRunning = await stopContainerRuntime(s.id);
      if (wasRunning) {
        containersStopped += 1;
        await db.insert(agentLogs).values({
          subscriptionId: s.id,
          level: "info",
          message: "Reconciler: контейнер остановлен (подписка не active)",
        });
      }
    } catch (error) {
      alert({
        key: `reconcile:stop-failed:${s.id}`,
        severity: "warn",
        title: "Reconciler: не удалось остановить контейнер",
        details: {
          subscriptionId: s.id,
          err: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  if (failed > 0) {
    alert({
      key: "recurring:cycle-failures",
      severity: "warn",
      title: `Recurring cycle had ${failed} failures`,
      details: {
        processed: rows.length,
        succeeded,
        failed,
        zombiesExpired: zombieResult.length,
        expired: expiredResult.length,
        containersStopped,
      },
    });
  }

  return NextResponse.json({
    processed: rows.length,
    succeeded,
    failed,
    zombiesExpired: zombieResult.length,
    expired: expiredResult.length,
    containersStopped,
  });
}
