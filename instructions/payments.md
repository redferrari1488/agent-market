# Payments — Instruction Module

**READ THIS ENTIRE FILE before working on payment-related code.**

## Architecture

Dual-provider system. User chooses provider at checkout. Platform commission: **15%**.

### Unified Interface (src/lib/payments/provider.ts)

```typescript
interface PaymentProvider {
  name: 'yookassa' | 'cryptomus';
  createCheckout(params: CreateCheckoutParams): Promise<{ checkoutUrl: string; providerRefId: string }>;
  handleWebhook(body: unknown, headers: Headers): Promise<WebhookEvent>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  createSellerAccount?(seller: Profile, kycData?: unknown): Promise<string>;
}
```

## YooKassa (RU, split payments)

**Marketplace product.** Platform = parent shop, each seller = sub-account via API `/v3/me`. KYC done by YooKassa.

- **Checkout:** `POST /v3/payments` with `amount`, `confirmation.type='redirect'`, `metadata={subscription_id, purchase_type, user_id, agent_id}`
- **Split (15% commission):** `transfers=[{account_id: seller.yookassa_account_id, amount: {value: price*0.85, currency: 'RUB'}}]`. Admin agents (seller_id NULL) — no transfers, 100% to platform
- **Subscriptions:** No native recurring. Emulated via saved `payment_method_id`: first payment with `save_payment_method=true`, subsequent via cron job (`POST /v3/payments` with `payment_method_id`). Cron daily checks `subscriptions` where `expires_at < now() + 1 day`
- **Webhook:** `payment.succeeded` -> create/extend subscription. `payment.canceled` -> cancel. Verification: IP whitelist + header signature

## Cryptomus (crypto, international)

- **Checkout:** `POST /v1/payment` with `amount`, `currency='USD'`, `order_id={subscription_uuid}`, `url_callback`, `url_success`
- **Subscriptions:** Native API `/v1/recurrence` — plan created at agent publication, user subscribes at checkout
- **Split (15% commission):** No native split. All money to platform, after webhook confirmation programmatically payout 85% to seller's `cryptomus_wallet_address` via `POST /v1/payout`. Idempotency via `provider_payment_id`
- **Webhook:** `payment.paid` -> create subscription + initiate payout. `subscription.active` -> active. Verification: MD5 signature of body with API key

## Provider Selection

At checkout user sees both options. Pre-selection by `Accept-Language` / geo (RU -> YooKassa). Provider stored in `subscriptions.payment_provider`.

## Activation

Payment activation is purely ENV-based. When YooKassa approves the application, add env vars to VPS — `providerEnvConfigured("yookassa")` returns true, `getProvider` returns real instance, `/api/checkout` switches from dev-stub to real checkout without code changes.

## NOT YET IMPLEMENTED

- `/api/seller/onboarding` — real YooKassa createSellerAccount (form with docs)
- ProviderPicker UI component — frontend doesn't pass `provider` to POST /api/checkout yet
- Cron for recurring YooKassa charges
- YooKassa IP verification in webhook route

## Lessons

*Empty — will be filled as mistakes happen.*
