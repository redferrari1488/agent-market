// YooKassa (РФ, split через Маркетплейс).
// Docs:
//   - Payments:   https://yookassa.ru/developers/api#create_payment
//   - Webhooks:   https://yookassa.ru/developers/using-api/webhooks
//   - Маркетплейс: https://yookassa.ru/developers/solutions-for-platforms/basics
//
// Модель B+C. Покупатель платит: seller_price + compute_price.
// Split 0% с части продавца: transfers[seller] = seller_price (100%).
// compute_price остаётся на балансе платформы — это hosting passthrough.
// Для админских агентов (seller_id=NULL) transfers[] пустой, 100% платформе.
//
// Recurring подписки. YooKassa нет нативного recurring — сохраняем
// payment_method_id и списываем через cron раз в сутки.

import { sellerPayout } from "../compute";
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

const API_URL = "https://api.yookassa.ru/v3";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`YooKassa: ${name} is not set`);
  return v;
}

function basicAuthHeader(): string {
  const shopId = requireEnv("YOOKASSA_SHOP_ID");
  const secret = requireEnv("YOOKASSA_SECRET_KEY");
  return "Basic " + Buffer.from(`${shopId}:${secret}`).toString("base64");
}

// Идемпотентный POST к YooKassa API. Ключ идемпотентности обязателен
// для всех POST-запросов в YooKassa — используем subscription_id + action.
async function post<T>(path: string, body: unknown, idempotenceKey: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YooKassa ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

type YooKassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
  payment_method?: { id: string; saved: boolean };
};

export async function chargeRecurringYooKassa(params: {
  paymentMethodId: string;
  amountMinor: number;
  subscriptionId: string;
  description: string;
  sellerAccountId?: string;
  sellerShareMinor?: number;
}): Promise<{ providerPaymentId: string; status: "succeeded" | "pending" | "canceled" }> {
  const body: Record<string, unknown> = {
    amount: {
      value: (params.amountMinor / 100).toFixed(2),
      currency: "RUB",
    },
    capture: true,
    payment_method_id: params.paymentMethodId,
    description: params.description,
    metadata: {
      subscription_id: params.subscriptionId,
    },
  };

  if (params.sellerAccountId && params.sellerShareMinor) {
    body.transfers = [{
      account_id: params.sellerAccountId,
      amount: {
        value: (params.sellerShareMinor / 100).toFixed(2),
        currency: "RUB",
      },
    }];
  }

  const payment = await post<YooKassaPayment>(
    "/payments",
    body,
    `recurring:${params.subscriptionId}:${Math.floor(Date.now() / 86_400_000)}`,
  );

  return {
    providerPaymentId: payment.id,
    status:
      payment.status === "succeeded"
        ? "succeeded"
        : payment.status === "canceled"
          ? "canceled"
          : "pending",
  };
}

export const yookassaProvider: PaymentProvider = {
  name: "yookassa",

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    const { agent, purchaseType, userId, userEmail, subscriptionId, successUrl, currency,
            sellerPriceMinor, totalMinor } = params;

    if (currency !== "RUB") {
      throw new Error(`YooKassa: unsupported currency ${currency}`);
    }

    // YooKassa ожидает сумму в рублях с двумя знаками после запятой.
    const amountRub = (totalMinor / 100).toFixed(2);

    // Split: 0% платформе, 100% продавцу с части продавца.
    // compute_price полностью остаётся на балансе платформы (passthrough).
    // Для админских агентов (seller_id = NULL) — без split, 100% платформе.
    const transfers: Array<{
      account_id: string;
      amount: { value: string; currency: string };
    }> = [];

    if (agent.sellerId) {
      // checkout route подкладывает sellerYookassaAccountId через join.
      // Если поля нет — no-split (страховка).
      const sellerAccountId = (agent as unknown as { sellerYookassaAccountId?: string })
        .sellerYookassaAccountId;
      if (sellerAccountId) {
        const sellerShare = sellerPayout(sellerPriceMinor);
        if (sellerShare > 0) {
          transfers.push({
            account_id: sellerAccountId,
            amount: {
              value: (sellerShare / 100).toFixed(2),
              currency: "RUB",
            },
          });
        }
      }
    }


    const metadata: Record<string, string> = {
      subscription_id: subscriptionId,
      user_id: userId,
      agent_id: agent.id,
      purchase_type: purchaseType,
    };
    if (userEmail) {
      metadata.user_email = userEmail;
    }

    const body: Record<string, unknown> = {
      amount: { value: amountRub, currency: "RUB" },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: successUrl,
      },
      description: `${agent.name} (${purchaseType})`,
      metadata,
      // Для подписок сохраняем payment_method, чтобы списывать автоматически.
      save_payment_method: purchaseType === "subscription",
    };

    if (transfers.length > 0) {
      body.transfers = transfers;
    }

    const payment = await post<YooKassaPayment>(
      "/payments",
      body,
      `checkout:${subscriptionId}`,
    );

    const url = payment.confirmation?.confirmation_url;
    if (!url) {
      throw new Error("YooKassa: confirmation_url missing in response");
    }

    return { checkoutUrl: url, providerRefId: payment.id };
  },

  async handleWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent> {
    void headers;
    // YooKassa не подписывает webhooks HMAC — защита через IP-whitelist в
    // route.ts. Здесь только парсинг тела.

    type Body = {
      event: string;
      object: YooKassaPayment;
    };
    const parsed = JSON.parse(rawBody) as Body;

    if (parsed.event === "payment.succeeded") {
      const obj = parsed.object;
      const subscriptionId = obj.metadata?.subscription_id;
      if (!subscriptionId) {
        return { type: "ignored", reason: "no subscription_id in metadata" };
      }
      const amount = Math.round(parseFloat(obj.amount.value) * 100);
      return {
        type: "payment.succeeded",
        subscriptionId,
        providerPaymentId: obj.id,
        providerSubscriptionId: obj.payment_method?.id,
        amount,
        currency: obj.amount.currency as PaymentCurrency,
      };
    }

    if (parsed.event === "payment.canceled") {
      const obj = parsed.object;
      const subscriptionId = obj.metadata?.subscription_id;
      if (!subscriptionId) {
        return { type: "ignored", reason: "no subscription_id in metadata" };
      }
      return { type: "payment.failed", subscriptionId };
    }

    return { type: "ignored", reason: `unhandled event: ${parsed.event}` };
  },

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    void providerSubscriptionId;
    // У YooKassa нет нативного recurring — отмена делается путём остановки
    // cron-списаний на нашей стороне. Здесь no-op, логика отмены в cron.
  },

  async payoutToSeller(params: PayoutParams): Promise<PayoutResult> {
    void params;
    // Не используется: split делается через transfers[] на createCheckout.
    throw new Error("YooKassa: payouts go through transfers[], not programmatic payouts");
  },

  async createSellerAccount(seller: ProfileRow, kycData?: unknown): Promise<string> {
    void seller;
    void kycData;
    // Создание субаккаунта продавца в YooKassa Маркетплейсе.
    // POST /v3/me — документы и данные продавца передаются в теле запроса.
    // Возвращает account_id субаккаунта, который кладём в
    // profiles.yookassa_account_id.
    //
    // Полноценная реализация требует:
    //   1) формы на /seller/onboarding с полями для ИП/ООО/СЗ
    //   2) загрузки документов (паспорт, выписка и т.п.)
    //   3) дождаться KYC от YooKassa
    //
    // Для скелета оставляю throw — подключим при работе над продавцами.
    throw new Error("YooKassa: createSellerAccount not yet implemented");
  },
};
