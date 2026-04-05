import Stripe from "stripe";

// Ленивая инициализация — Stripe SDK требует ключ при создании,
// но при билде ключа может не быть
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

// ID администратора платформы (владелец стартовых агентов)
const PLATFORM_ADMIN_ID = process.env.PLATFORM_ADMIN_ID || "admin";

// Комиссия платформы — 15%
const PLATFORM_FEE_PERCENT = 15;

export type PurchaseType = "subscription" | "one_time";

/**
 * Создать Stripe Price для агента.
 * mode = 'subscription' — recurring/month, mode = 'one_time' — разовая покупка
 */
export async function createAgentPrice(
  agentName: string,
  priceInCents: number,
  mode: PurchaseType,
  existingProductId?: string
): Promise<{ priceId: string; productId: string }> {
  const stripe = getStripe();

  // Переиспользуем product если он уже есть (для случая 'both')
  const productId =
    existingProductId ||
    (await stripe.products.create({ name: agentName })).id;

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: priceInCents,
    currency: "usd",
    ...(mode === "subscription" && { recurring: { interval: "month" } }),
  });

  return { priceId: price.id, productId };
}

/**
 * Создать Checkout Session для агента.
 * Если продавец не админ — split payment через Stripe Connect (15% комиссия).
 */
export async function createCheckoutSession({
  priceId,
  priceAmount,
  purchaseType,
  sellerId,
  sellerStripeAccountId,
  userId,
  agentId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  priceAmount: number; // в центах — нужно для расчёта fee при one-time
  purchaseType: PurchaseType;
  sellerId: string;
  sellerStripeAccountId: string | null;
  userId: string;
  agentId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const isOwnAgent = sellerId === PLATFORM_ADMIN_ID;
  const isSubscription = purchaseType === "subscription";

  // Базовые параметры сессии
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    mode: isSubscription ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      agent_id: agentId,
      purchase_type: purchaseType,
    },
  };

  // Split payment для сторонних продавцов
  const needsSplit = !isOwnAgent && sellerStripeAccountId;

  if (isSubscription) {
    params.subscription_data = {
      metadata: {
        user_id: userId,
        agent_id: agentId,
        purchase_type: purchaseType,
      },
    };
    if (needsSplit) {
      params.subscription_data.application_fee_percent = PLATFORM_FEE_PERCENT;
      params.subscription_data.transfer_data = {
        destination: sellerStripeAccountId,
      };
    }
  } else {
    // Для разовой покупки — application_fee_amount в центах
    if (needsSplit) {
      params.payment_intent_data = {
        application_fee_amount: calculateApplicationFee(priceAmount),
        transfer_data: {
          destination: sellerStripeAccountId,
        },
      };
    }
  }

  return stripe.checkout.sessions.create(params);
}

/**
 * Вычислить application_fee_amount для разовой покупки (в центах).
 */
export function calculateApplicationFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);
}

/**
 * Создать Stripe Connect Account Link для онбординга продавца
 */
export async function createConnectAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return accountLink.url;
}

/**
 * Создать Stripe Connect Account для продавца
 */
export async function createConnectAccount(
  email: string
): Promise<Stripe.Account> {
  return getStripe().accounts.create({
    type: "standard",
    email,
  });
}

/**
 * Получить статус Stripe Connect Account
 */
export async function getConnectAccountStatus(
  accountId: string
): Promise<{ chargesEnabled: boolean; payoutsEnabled: boolean }> {
  const account = await getStripe().accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  };
}

/**
 * Верифицировать webhook и вернуть event
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
