// Единый интерфейс платёжного провайдера.
// Реализации: yookassa.ts, cryptomus.ts. Фабрика: index.ts.
// Принцип: вся специфика провайдера спрятана за этим интерфейсом,
// API routes работают только с PaymentProvider.

import type { agents as agentsTable, profiles as profilesTable } from "@/lib/db/schema";

export type ProviderName = "yookassa" | "cryptomus";

export type PurchaseType = "subscription" | "one_time";

// Строгий тип агента из Drizzle-схемы (все поля, которые нужны провайдерам).
export type AgentRow = typeof agentsTable.$inferSelect;
export type ProfileRow = typeof profilesTable.$inferSelect;

export type CreateCheckoutParams = {
  agent: AgentRow;
  purchaseType: PurchaseType;
  userId: string;
  subscriptionId: string; // уже созданная запись в subscriptions со статусом pending
  successUrl: string;
  cancelUrl: string;
  // Модель B+C: цены разделены для корректного split.
  // sellerPriceKopecks = price_monthly/price_onetime агента (труд продавца).
  // computePriceKopecks = стоимость хостинга (passthrough платформы).
  // Провайдер списывает totalPrice = seller + compute, а split делает только с seller.
  sellerPriceKopecks: number;
  computePriceKopecks: number;
};

export type CreateCheckoutResult = {
  checkoutUrl: string;
  providerRefId: string; // provider_payment_id или provider_subscription_id
};

// Нормализованное событие из вебхука — то, что кладём в subscriptions.
export type WebhookEvent =
  | {
      type: "payment.succeeded";
      subscriptionId: string; // наш внутренний UUID, из metadata/order_id
      providerPaymentId: string;
      providerSubscriptionId?: string;
      amount: number; // в минимальных единицах
      currency: string;
      sellerShareAmount?: number; // сколько должно уйти продавцу (88% от seller_price)
      sellerWalletOrAccount?: string; // куда платить продавцу
    }
  | {
      type: "payment.failed";
      subscriptionId: string;
      reason?: string;
    }
  | {
      type: "subscription.cancelled";
      providerSubscriptionId: string;
    }
  | {
      type: "ignored";
      reason: string;
    };

export type PayoutParams = {
  sellerId: string;
  amount: number;
  currency: string;
  sellerWalletOrAccount: string;
  reference: string; // subscription_id или payment_id для идемпотентности
};

export type PayoutResult = {
  providerTransferId: string;
  status: "pending" | "processing" | "completed" | "failed";
};

export interface PaymentProvider {
  readonly name: ProviderName;

  // Создаёт checkout у провайдера, возвращает URL для редиректа юзера.
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>;

  // Верифицирует подпись вебхука и парсит его в WebhookEvent.
  handleWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent>;

  // Отменяет подписку у провайдера.
  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  // Программный payout продавцу (используется Cryptomus-ом, где нет нативного split).
  // YooKassa использует split через transfers[] на этапе createCheckout,
  // поэтому там payoutToSeller no-op или бросает not-implemented.
  payoutToSeller(params: PayoutParams): Promise<PayoutResult>;

  // Онбординг продавца. Для YooKassa — создание субаккаунта в Маркетплейсе.
  // Для Cryptomus — валидация адреса кошелька (KYC не нужен).
  // Возвращает идентификатор, который кладём в profiles.yookassa_account_id
  // или profiles.cryptomus_wallet_address.
  createSellerAccount(seller: ProfileRow, kycData?: unknown): Promise<string>;
}

// Проверяет, что env-переменные для провайдера заполнены.
// Используется фабрикой getProvider: если credentials нет — возвращаем null,
// API routes падают обратно на dev-stub checkout.
export function providerEnvConfigured(name: ProviderName): boolean {
  if (name === "yookassa") {
    return Boolean(
      process.env.YOOKASSA_SHOP_ID &&
        process.env.YOOKASSA_SECRET_KEY &&
        process.env.YOOKASSA_WEBHOOK_SECRET,
    );
  }
  if (name === "cryptomus") {
    return Boolean(
      process.env.CRYPTOMUS_MERCHANT_ID &&
        process.env.CRYPTOMUS_API_KEY &&
        process.env.CRYPTOMUS_PAYOUT_API_KEY &&
        process.env.CRYPTOMUS_WEBHOOK_SECRET,
    );
  }
  return false;
}
