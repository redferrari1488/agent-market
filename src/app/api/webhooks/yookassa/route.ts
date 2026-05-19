import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { getProvider } from "@/lib/payments";
import { logger } from "@/lib/logger";
import { alert } from "@/lib/alerter";

// Webhook от YooKassa. Вызывается самим YooKassa после событий
// payment.succeeded / payment.canceled. Настройка URL в личном кабинете
// магазина: {NEXT_PUBLIC_APP_URL}/api/webhooks/yookassa

// YooKassa documented IPs (April 19, 2026):
// https://yookassa.ru/developers/using-api/webhooks
const YOOKASSA_IPS_V4 = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11/32",
  "77.75.156.35/32",
  "77.75.154.128/25",
];
const YOOKASSA_IPS_V6 = ["2a02:5180::/32"];

function normalizeClientIp(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    return trimmed.slice(1, trimmed.indexOf("]"));
  }

  if (trimmed.includes(".") && trimmed.includes(":")) {
    return trimmed.slice(0, trimmed.lastIndexOf(":"));
  }

  return trimmed;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const nums = parts.map((part) => Number(part));
  if (nums.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return (
    (((nums[0] << 24) >>> 0) |
      ((nums[1] << 16) >>> 0) |
      ((nums[2] << 8) >>> 0) |
      nums[3]) >>> 0
  );
}

function expandIpv6(ip: string): string[] | null {
  const normalized = ip.toLowerCase();
  if (normalized.includes(":::")) {
    return null;
  }

  const [left, right] = normalized.split("::");
  const leftParts = left ? left.split(":").filter(Boolean) : [];
  const rightParts = right ? right.split(":").filter(Boolean) : [];

  if (!normalized.includes("::") && leftParts.length !== 8) {
    return null;
  }

  const missing = normalized.includes("::")
    ? 8 - (leftParts.length + rightParts.length)
    : 0;

  if (missing < 0) {
    return null;
  }

  const parts = [
    ...leftParts,
    ...Array.from({ length: missing }, () => "0"),
    ...rightParts,
  ];

  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{0,4}$/.test(part))) {
    return null;
  }

  return parts.map((part) => part.padStart(4, "0"));
}

function ipv6ToBigInt(ip: string): bigint | null {
  const parts = expandIpv6(ip);
  if (!parts) {
    return null;
  }

  return parts.reduce(
    (acc, part) => (acc << BigInt(16)) + BigInt(parseInt(part, 16)),
    BigInt(0),
  );
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [range, prefixRaw] = cidr.split("/");
  const prefix = Number(prefixRaw);

  if (ip.includes(":") || range.includes(":")) {
    const ipValue = ipv6ToBigInt(ip);
    const rangeValue = ipv6ToBigInt(range);
    if (ipValue == null || rangeValue == null || !Number.isInteger(prefix) || prefix < 0 || prefix > 128) {
      return false;
    }

    if (prefix === 0) {
      return true;
    }

    const hostBits = BigInt(128) - BigInt(prefix);
    const mask =
      ((BigInt(1) << BigInt(128)) - BigInt(1)) ^
      ((BigInt(1) << hostBits) - BigInt(1));
    return (ipValue & mask) === (rangeValue & mask);
  }

  const ipValue = ipv4ToInt(ip);
  const rangeValue = ipv4ToInt(range);
  if (ipValue == null || rangeValue == null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  if (prefix === 0) {
    return true;
  }

  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipValue & mask) === (rangeValue & mask);
}

function getClientIp(req: Request): string {
  // ВАЖНО: x-real-ip первым. nginx ставит его из $remote_addr, app слушает
  // 127.0.0.1:3000, значит x-real-ip приходит только из доверенного nginx.
  // x-forwarded-for от внешних клиентов спуфится тривиально — оставлен как
  // fallback на dev-окружении без nginx. Согласовано с src/lib/rate-limit.ts:getClientIp.
  const xri = req.headers.get("x-real-ip");
  if (xri) {
    return normalizeClientIp(xri);
  }

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return normalizeClientIp(xff.split(",")[0]);
  }

  return "";
}

export async function POST(req: Request) {
  try {
    if (process.env.YOOKASSA_IP_CHECK !== "off") {
      const ip = getClientIp(req);
      const ranges = ip.includes(":") ? YOOKASSA_IPS_V6 : YOOKASSA_IPS_V4;

      if (!ip || !ranges.some((cidr) => ipInCidr(ip, cidr))) {
        logger.warn({ ip }, "yookassa webhook: rejected ip");
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    const provider = getProvider("yookassa");
    if (!provider) {
      return NextResponse.json({ error: "provider not configured" }, { status: 503 });
    }

    const rawBody = await req.text();
    const event = await provider.handleWebhook(rawBody, req.headers);

    if (event.type === "ignored") {
      return NextResponse.json({ ok: true, ignored: event.reason });
    }

    if (event.type === "payment.succeeded") {
      const [sub] = await db
        .select({
          status: subscriptions.status,
          purchaseType: subscriptions.purchaseType,
          expiresAt: subscriptions.expiresAt,
          providerPaymentId: subscriptions.providerPaymentId,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
        })
        .from(subscriptions)
        .where(eq(subscriptions.id, event.subscriptionId))
        .limit(1);

      if (!sub) {
        return NextResponse.json({ ok: true, warning: "subscription not found" });
      }

      // cancelled — terminal. Если юзер отменил подписку и потом приходит
      // late webhook (network retry, провайдер реплеит payment.succeeded),
      // НЕ реактивируем. Без этого guard cancelled subscriptions могли
      // молча возвращаться в pending_setup.
      if (sub.status === "cancelled") {
        return NextResponse.json({ ok: true, ignored: "subscription is cancelled" });
      }

      // Amount/currency tampering guard. checkout/route.ts фиксирует ожидаемые
      // amount + currency в момент создания подписки; cron recurring шлёт ровно
      // эти же значения в chargeRecurringYooKassa. Любое расхождение между
      // event.* и sub.* означает, что webhook прилетел с другой суммой —
      // защита от инжекции через misconfigured IP-whitelist или провайдерский
      // bug (например, partial capture).
      if (sub.amount != null && event.amount !== sub.amount) {
        logger.error(
          { subscriptionId: event.subscriptionId, expected: sub.amount, got: event.amount },
          "yookassa webhook: amount mismatch",
        );
        alert({
          key: "yookassa:amount-mismatch",
          severity: "critical",
          title: "YooKassa webhook amount mismatch",
          details: {
            subscriptionId: event.subscriptionId,
            expected: sub.amount,
            got: event.amount,
          },
        });
        return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
      }
      if (sub.currency != null && event.currency !== sub.currency) {
        logger.error(
          { subscriptionId: event.subscriptionId, expected: sub.currency, got: event.currency },
          "yookassa webhook: currency mismatch",
        );
        alert({
          key: "yookassa:currency-mismatch",
          severity: "critical",
          title: "YooKassa webhook currency mismatch",
          details: {
            subscriptionId: event.subscriptionId,
            expected: sub.currency,
            got: event.currency,
          },
        });
        return NextResponse.json({ error: "currency mismatch" }, { status: 400 });
      }

      // Idempotency: webhook уже отработал — provider_payment_id совпадает
      // и expires_at заполнен (для one_time проверяем только id, для
      // subscription также expires_at — это исключает race с cron, который
      // мог уже продлить подписку с новым payment_id).
      const alreadyProcessed =
        sub.providerPaymentId === event.providerPaymentId &&
        (sub.purchaseType !== "subscription" || sub.expiresAt != null);

      if (alreadyProcessed) {
        return NextResponse.json({ ok: true, idempotent: true });
      }

      // Только initial purchase переводит статус в pending_setup.
      // Recurring webhook на active-подписке НЕ должен сбрасывать её в setup.
      const isInitial = sub.status === "pending_setup";
      const newStatus = isInitial ? "pending_setup" : sub.status;

      await db
        .update(subscriptions)
        .set({
          status: newStatus,
          providerPaymentId: event.providerPaymentId,
          providerSubscriptionId: event.providerSubscriptionId ?? null,
          paymentProvider: "yookassa",
          amount: event.amount,
          currency: event.currency,
          ...(sub.purchaseType === "subscription"
            ? { expiresAt: sql`now() + interval '1 month'` }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, event.subscriptionId));

      return NextResponse.json({ ok: true });
    }

    if (event.type === "payment.failed") {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(subscriptions.id, event.subscriptionId));

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, "yookassa webhook error");
    alert({
      key: "yookassa:webhook-5xx",
      severity: "critical",
      title: "YooKassa webhook processing failed",
      details: { err: error },
    });
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}
