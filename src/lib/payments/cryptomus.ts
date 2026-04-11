// Cryptomus (крипта, интернациональный).
// Docs:
//   - Payments:     https://doc.cryptomus.com/payments/creating-invoice
//   - Recurring:    https://doc.cryptomus.com/recurring
//   - Payouts:      https://doc.cryptomus.com/payouts
//   - Webhook sign: https://doc.cryptomus.com/payments/webhook
//
// Auth: каждый запрос подписывается MD5(base64(body) + API_KEY).
// Merchant ID передаётся в заголовке merchant.
//
// Split 15%. Cryptomus нет нативного split — все деньги идут платформе,
// после успешного вебхука мы программно инициируем payout 85% на
// cryptomus_wallet_address продавца через /v1/payout.

import { createHash } from "crypto";
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CreateCheckoutResult,
  PayoutParams,
  PayoutResult,
  ProfileRow,
  WebhookEvent,
} from "./provider";

const API_URL = "https://api.cryptomus.com";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Cryptomus: ${name} is not set`);
  return v;
}

// Подпись Cryptomus: MD5( base64(json_body) + api_key ).
function sign(body: unknown, apiKey: string): string {
  const base64 = Buffer.from(JSON.stringify(body)).toString("base64");
  return createHash("md5").update(base64 + apiKey).digest("hex");
}

async function post<T>(
  path: string,
  body: unknown,
  apiKeyEnv: "CRYPTOMUS_API_KEY" | "CRYPTOMUS_PAYOUT_API_KEY",
): Promise<T> {
  const merchantId = requireEnv("CRYPTOMUS_MERCHANT_ID");
  const apiKey = requireEnv(apiKeyEnv);
  const signature = sign(body, apiKey);

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      merchant: merchantId,
      sign: signature,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cryptomus ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

type CryptomusPayment = {
  state: number;
  result: {
    uuid: string;
    order_id: string;
    amount: string;
    currency: string;
    url: string;
    status: string;
  };
};

export const cryptomusProvider: PaymentProvider = {
  name: "cryptomus",

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    const { agent, purchaseType, subscriptionId, successUrl, cancelUrl } = params;

    // Cryptomus принимает сумму в USD (или RUB с автоконвертом).
    // Если у агента задана цена в USD — используем её, иначе конвертируем
    // из RUB (Cryptomus сам пересчитает по своему курсу, если currency=RUB).
    const usdCents =
      purchaseType === "subscription" ? agent.priceMonthlyUsd : agent.priceOnetimeUsd;
    const rubKopecks =
      purchaseType === "subscription" ? agent.priceMonthly : agent.priceOnetime;

    let amountStr: string;
    let currency: string;

    if (usdCents != null) {
      amountStr = (usdCents / 100).toFixed(2);
      currency = "USD";
    } else if (rubKopecks != null) {
      amountStr = (rubKopecks / 100).toFixed(2);
      currency = "RUB";
    } else {
      throw new Error("Cryptomus: agent has no price for requested purchaseType");
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cryptomus`;

    const body = {
      amount: amountStr,
      currency,
      order_id: subscriptionId,
      url_callback: callbackUrl,
      url_success: successUrl,
      url_return: cancelUrl,
      lifetime: 3600,
    };

    const response = await post<CryptomusPayment>("/v1/payment", body, "CRYPTOMUS_API_KEY");

    return {
      checkoutUrl: response.result.url,
      providerRefId: response.result.uuid,
    };
  },

  async handleWebhook(rawBody: string, _headers: Headers): Promise<WebhookEvent> {
    const apiKey = requireEnv("CRYPTOMUS_WEBHOOK_SECRET");

    type Body = {
      type: string;
      uuid: string;
      order_id: string;
      amount: string;
      currency: string;
      status: string;
      sign: string;
      [k: string]: unknown;
    };

    const parsed = JSON.parse(rawBody) as Body;

    // Верификация подписи: пересчитываем MD5 от тела без поля sign + api_key.
    const { sign: receivedSign, ...payload } = parsed;
    const expectedSign = sign(payload, apiKey);
    if (receivedSign !== expectedSign) {
      return { type: "ignored", reason: "invalid signature" };
    }

    // status: paid, paid_over, wrong_amount, wrong_amount_waiting, ...
    const isPaid = parsed.status === "paid" || parsed.status === "paid_over";
    if (isPaid) {
      const amount = Math.round(parseFloat(parsed.amount) * 100);
      return {
        type: "payment.succeeded",
        subscriptionId: parsed.order_id,
        providerPaymentId: parsed.uuid,
        amount,
        currency: parsed.currency,
      };
    }

    if (parsed.status === "fail" || parsed.status === "cancel") {
      return {
        type: "payment.failed",
        subscriptionId: parsed.order_id,
        reason: parsed.status,
      };
    }

    return { type: "ignored", reason: `status: ${parsed.status}` };
  },

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    await post(
      "/v1/recurrence/cancel",
      { uuid: providerSubscriptionId },
      "CRYPTOMUS_API_KEY",
    );
  },

  async payoutToSeller(params: PayoutParams): Promise<PayoutResult> {
    // Программный payout 85% продавцу после webhook.
    // Идемпотентность через order_id = subscription_id + "-payout".
    type PayoutResp = {
      state: number;
      result: { uuid: string; status: string };
    };

    const body = {
      amount: (params.amount / 100).toFixed(2),
      currency: params.currency,
      order_id: `${params.reference}-payout`,
      address: params.sellerWalletOrAccount,
      is_subtract: "0", // комиссию сети платим мы
      network: "TRON", // дефолт USDT-TRC20, можно расширить
    };

    const res = await post<PayoutResp>("/v1/payout", body, "CRYPTOMUS_PAYOUT_API_KEY");

    return {
      providerTransferId: res.result.uuid,
      status: res.result.status === "paid" ? "completed" : "processing",
    };
  },

  async createSellerAccount(seller: ProfileRow): Promise<string> {
    // Cryptomus не требует KYC и не создаёт субаккаунты. Онбординг продавца
    // сводится к сохранению адреса кошелька в profiles.cryptomus_wallet_address.
    // Здесь можно добавить валидацию адреса через /v1/payout/check.
    // Для скелета просто возвращаем адрес обратно (вызывающий код
    // получает его из формы онбординга).
    const wallet = seller.cryptmusWalletAddress;
    if (!wallet) {
      throw new Error("Cryptomus: wallet address not provided");
    }
    return wallet;
  },
};
