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

// Комиссия платформы — 25%
const PLATFORM_FEE_PERCENT = 25;

/**
 * Создать Stripe Price для агента (recurring/month)
 */
export async function createAgentPrice(
  agentName: string,
  priceInCents: number
): Promise<string> {
  const stripe = getStripe();
  const product = await stripe.products.create({
    name: agentName,
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceInCents,
    currency: "usd",
    recurring: { interval: "month" },
  });

  return price.id;
}

/**
 * Создать Checkout Session для подписки на агента.
 * Если продавец не админ — split payment через Stripe Connect (25% комиссия).
 */
export async function createCheckoutSession({
  priceId,
  sellerId,
  sellerStripeAccountId,
  userId,
  agentId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  sellerId: string;
  sellerStripeAccountId: string | null;
  userId: string;
  agentId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const isOwnAgent = sellerId === PLATFORM_ADMIN_ID;

  // Базовые параметры сессии
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      agent_id: agentId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        agent_id: agentId,
      },
    },
  };

  // Split payment для сторонних продавцов
  if (!isOwnAgent && sellerStripeAccountId && params.subscription_data) {
    params.subscription_data.application_fee_percent = PLATFORM_FEE_PERCENT;
    params.subscription_data.transfer_data = {
      destination: sellerStripeAccountId,
    };
  }

  return stripe.checkout.sessions.create(params);
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
