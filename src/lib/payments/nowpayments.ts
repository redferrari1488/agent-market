// NowPayments (крипта, интернациональный). Заменил Cryptomus в мае 2026 — у того
// FINTRAC CAD 177M штраф + TRM Labs о связях с подсанкционными биржами/CSAM,
// риск блокировки tainted USDT в P2P-площадках. NowPayments — UK, 0.5%, чистая
// репутация.
//
// Docs:
//   - Invoice:      https://documenter.getpostman.com/view/7907941/S1a32n38#3e8c4d8a
//   - IPN webhook:  https://documenter.getpostman.com/view/7907941/S1a32n38#13e02d77
//   - Status flow:  https://nowpayments.io/help/lifecycle-payment
//
// Auth: header `x-api-key: <NOWPAYMENTS_API_KEY>` на КАЖДЫЙ запрос.
// IPN подпись: header `x-nowpayments-sig` = HMAC-SHA512(sortedJSON(body), IPN_SECRET) hex.
//
// Phase 0: бесплатное размещение для сторонних, комиссия не берётся.
// NowPayments не имеет нативного split — все деньги идут платформе. Mass payout
// требует JWT+2FA, поэтому payoutToSeller сейчас stub (бросает not-implemented),
// webhook ловит и пишет payouts.status='pending' для ручной выплаты админом.
// Real payout вернём вместе с появлением сторонних продавцов.

import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CreateCheckoutResult,
  PaymentCurrency,
  PayoutParams,
  PayoutResult,
  ProfileRow,
  WebhookEvent,
} from "./provider";

const API_URL = "https://api.nowpayments.io/v1";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`NowPayments: ${name} is not set`);
  return v;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const apiKey = requireEnv("NOWPAYMENTS_API_KEY");
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NowPayments ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

// Рекурсивная сортировка ключей. NowPayments при формировании подписи
// сериализует тело IPN с отсортированными ключами (на всех уровнях), мы должны
// сделать то же самое — иначе HMAC не совпадёт.
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

type NowPaymentsInvoice = {
  id: string;
  invoice_url: string;
  order_id: string;
};

type IPNBody = {
  payment_id?: string | number;
  payment_status: string;
  order_id: string;
  price_amount: number;
  price_currency: string;
  pay_amount?: number;
  actually_paid?: number;
  pay_currency?: string;
  [k: string]: unknown;
};

export const nowpaymentsProvider: PaymentProvider = {
  name: "nowpayments",

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    const { subscriptionId, successUrl, cancelUrl, totalMinor, currency } = params;
    const priceAmount = totalMinor / 100;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`;

    const body = {
      price_amount: priceAmount,
      price_currency: currency.toLowerCase(),
      order_id: subscriptionId,
      ipn_callback_url: callbackUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
      is_fee_paid_by_user: true,
    };

    const invoice = await post<NowPaymentsInvoice>("/invoice", body);

    return {
      checkoutUrl: invoice.invoice_url,
      providerRefId: String(invoice.id),
    };
  },

  async handleWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent> {
    const ipnSecret = requireEnv("NOWPAYMENTS_IPN_SECRET");

    const receivedSign = headers.get("x-nowpayments-sig") ?? "";
    const parsed = JSON.parse(rawBody) as IPNBody;

    // Пересчитываем HMAC от тела с отсортированными ключами и сравниваем
    // через timingSafeEqual (как с cryptomus — чтобы исключить тайминговый
    // канал утечки подписи).
    const sortedBody = JSON.stringify(sortKeys(parsed));
    const expectedSign = createHmac("sha512", ipnSecret).update(sortedBody).digest("hex");

    const receivedBuf = Buffer.from(receivedSign, "hex");
    const expectedBuf = Buffer.from(expectedSign, "hex");

    if (
      receivedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      return { type: "ignored", reason: "invalid signature" };
    }

    // payment_status: waiting | confirming | confirmed | sending |
    //   partially_paid | finished | failed | refunded | expired
    // Деньги реально лежат на балансе мерчанта только в finished.
    if (parsed.payment_status === "finished") {
      const priceCurrency = parsed.price_currency.toUpperCase() as PaymentCurrency;
      const amountMinor = Math.round(parsed.price_amount * 100);
      return {
        type: "payment.succeeded",
        subscriptionId: parsed.order_id,
        providerPaymentId: String(parsed.payment_id ?? ""),
        amount: amountMinor,
        currency: priceCurrency,
      };
    }

    if (
      parsed.payment_status === "failed" ||
      parsed.payment_status === "expired" ||
      parsed.payment_status === "refunded"
    ) {
      return {
        type: "payment.failed",
        subscriptionId: parsed.order_id,
        reason: parsed.payment_status,
      };
    }

    return { type: "ignored", reason: `status: ${parsed.payment_status}` };
  },

  async cancelSubscription(): Promise<void> {
    // NowPayments Subscriptions API не используем — у нас one-time invoice per
    // подписку, продление вручную (см. план миграции). Метод оставлен no-op,
    // чтобы интерфейс PaymentProvider не разъезжался с yookassaProvider.
  },

  async payoutToSeller(_params: PayoutParams): Promise<PayoutResult> {
    // Stub: NowPayments mass payout требует JWT-auth (email/password) + 2FA,
    // что превышает скоуп Phase 0. Webhook ловит исключение и пишет
    // payouts.status='pending' с пометкой для ручной выплаты админом.
    throw new Error("NowPayments automated payout is not implemented yet — manual payout required");
  },

  async createSellerAccount(seller: ProfileRow): Promise<string> {
    // NowPayments не имеет аккаунтов продавцов — деньги получает платформа,
    // на seller payout идёт отдельно через mass-payout. Здесь только
    // sanity-check, что хоть один адрес кошелька сохранён.
    const wallets = seller.cryptoWallets;
    if (
      !wallets ||
      (!wallets.usdt_trc20 && !wallets.usdc_sol && !wallets.btc)
    ) {
      throw new Error("NowPayments: no crypto wallet configured");
    }
    return JSON.stringify(wallets);
  },
};
