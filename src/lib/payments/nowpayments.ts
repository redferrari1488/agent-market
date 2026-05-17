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

// Кастомный класс ошибок NowPayments. Расширяет Error, поэтому существующие
// `throw err`-цепочки и `err.message` в route.ts работают без изменений.
// statusCode/code дают каллерам возможность дискриминировать ошибки, если
// понадобится (но пока обходимся дружелюбным message).
export class NowPaymentsError extends Error {
  statusCode: number;
  code?: string;
  rawBody?: string;
  constructor(message: string, statusCode: number, code?: string, rawBody?: string) {
    super(message);
    this.name = "NowPaymentsError";
    this.statusCode = statusCode;
    this.code = code;
    this.rawBody = rawBody;
  }
}

// Маппит HTTP-статус + parsed error body NowPayments в дружелюбное сообщение
// для покупателя. Этот текст всплывает в UI через response.error из /api/checkout.
function friendlyErrorMessage(
  statusCode: number,
  parsed: { code?: string; message?: string },
  fallback: string,
): string {
  if (statusCode >= 500) {
    return "Криптовалютный шлюз временно недоступен — попробуйте через несколько минут или оплатите через ЮКассу.";
  }

  const code = (parsed.code || "").toUpperCase();
  const msg = parsed.message || "";

  // 422 MIN_AMOUNT_ERROR: сумма меньше минимума для выбранной криптосети
  // (USDT TRC20 ≈ $2, BTC ≈ $10). NowPayments не позволит провести invoice.
  if (code.includes("MIN_AMOUNT") || /minimum amount|less than min/i.test(msg)) {
    return "Сумма ниже минимума криптовалютной сети. Оплатите через ЮКассу или увеличьте сумму.";
  }

  // После failed/expired платежа NowPayments может временно отключить
  // создание новых invoice'ов для того же мерчанта (cooldown ~1-2 часа).
  if (
    code.includes("NOT_AVAILABLE") ||
    code.includes("UNAVAILABLE") ||
    /currently unavailable|try.*in.*\d+\s*hours?/i.test(msg)
  ) {
    return "Криптовалютный шлюз сейчас в режиме ожидания после прошлого платежа — попробуйте через 1-2 часа или оплатите через ЮКассу.";
  }

  // 401/403 = неверный API ключ. Это конфигурация платформы, не вина юзера.
  // Логируем raw, но юзеру показываем generic.
  if (statusCode === 401 || statusCode === 403) {
    return "Криптовалютный платёж временно недоступен. Оплатите через ЮКассу — мы уже разбираемся.";
  }

  return msg || fallback;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const apiKey = requireEnv("NOWPAYMENTS_API_KEY");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // fetch бросает только при network failure (DNS, TLS, connection reset).
    // Это всегда «провайдер недоступен», возвращаем дружелюбный текст.
    const detail = err instanceof Error ? err.message : String(err);
    throw new NowPaymentsError(
      "Криптовалютный шлюз недоступен (network error) — попробуйте позже или оплатите через ЮКассу.",
      0,
      "NETWORK_ERROR",
      detail,
    );
  }

  if (!res.ok) {
    const text = await res.text();
    let parsed: { code?: string; message?: string } = {};
    try {
      parsed = JSON.parse(text) as { code?: string; message?: string };
    } catch {
      // body не JSON — оставляем parsed пустым, friendlyErrorMessage отработает на fallback
    }
    throw new NowPaymentsError(
      friendlyErrorMessage(res.status, parsed, `HTTP ${res.status}`),
      res.status,
      parsed.code,
      text,
    );
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
