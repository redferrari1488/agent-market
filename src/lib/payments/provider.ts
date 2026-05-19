// Единый интерфейс платёжного провайдера.
// Реализации: yookassa.ts, nowpayments.ts. Фабрика: index.ts.
// Принцип: вся специфика провайдера спрятана за этим интерфейсом,
// API routes работают только с PaymentProvider.

import type { agents as agentsTable, profiles as profilesTable } from "@/lib/db/schema";

export type ProviderName = "yookassa" | "nowpayments";
export type PaymentCurrency = "RUB" | "USD";

export type PurchaseType = "subscription" | "one_time";

// Строгий тип агента из Drizzle-схемы (все поля, которые нужны провайдерам).
export type AgentRow = typeof agentsTable.$inferSelect;
export type ProfileRow = typeof profilesTable.$inferSelect;

export type CreateCheckoutParams = {
  agent: AgentRow;
  purchaseType: PurchaseType;
  userId: string;
  userEmail?: string; // прокидывается в metadata провайдера для fraud-detection
  subscriptionId: string; // уже созданная запись в subscriptions со статусом pending
  successUrl: string;
  cancelUrl: string;
  currency: PaymentCurrency;
  // sellerPriceMinor = цена продавца в минорных единицах валюты платежа.
  // В Phase 0 равен totalMinor (compute не добавляется). totalMinor оставлен
  // отдельно, чтобы интерфейс пережил будущий переход на gross/commission модель.
  sellerPriceMinor: number;
  totalMinor: number;
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
      amount: number; // в минорных единицах валюты платежа
      currency: PaymentCurrency;
      sellerShareAmount?: number; // сколько должно уйти продавцу (sellerPayout от seller_price)
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
  currency: PaymentCurrency;
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

  // Программный payout продавцу. У NowPayments mass payout требует JWT+2FA —
  // Phase 0 stub бросает not-implemented, webhook ловит и пишет payouts.status=pending
  // (admin делает выплату вручную). YooKassa использует split через transfers[]
  // на этапе createCheckout, поэтому там тоже no-op.
  payoutToSeller(params: PayoutParams): Promise<PayoutResult>;

  // Онбординг продавца. Для YooKassa — создание субаккаунта в Маркетплейсе.
  // Для NowPayments — валидация адресов кошельков (KYC не нужен).
  // Возвращает идентификатор, который кладём в profiles.yookassa_account_id
  // или сериализованный snapshot crypto_wallets.
  createSellerAccount(seller: ProfileRow, kycData?: unknown): Promise<string>;
}

// Проверяет, что env-переменные для провайдера заполнены и имеют корректный
// формат. Используется фабрикой getProvider: если credentials нет/мусор —
// возвращаем null, API routes падают обратно на dev-stub checkout (в проде
// дополнительно есть guard в checkout/route.ts).
//
// Format-check ловит типичные ошибки: пустые/обрезанные env, переставленные
// shop_id/secret_key, забытый `live_`/`test_` префикс. Без него mis-config
// проявляется только на первом реальном платеже 401-кой от провайдера.
export function providerEnvConfigured(name: ProviderName): boolean {
  if (name === "yookassa") {
    const shopId = process.env.YOOKASSA_SHOP_ID?.trim() ?? "";
    const secret = process.env.YOOKASSA_SECRET_KEY?.trim() ?? "";
    // shop_id — числовой идентификатор магазина (6-9 цифр на практике).
    // secret_key — формат `live_xxx` или `test_xxx`, минимум ~30 символов.
    return /^\d{4,12}$/.test(shopId) && /^(live|test)_[A-Za-z0-9_-]{20,}$/.test(secret);
  }
  if (name === "nowpayments") {
    const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim() ?? "";
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET?.trim() ?? "";
    // API key — alphanumeric с дефисами, ~25-50 chars.
    // IPN secret — произвольная строка, минимум 16 символов для HMAC.
    return /^[A-Za-z0-9_-]{16,}$/.test(apiKey) && ipnSecret.length >= 16;
  }
  return false;
}
