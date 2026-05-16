# Payments — Instruction Module

**READ THIS ENTIRE FILE before working on payment-related code.**

## Architecture

Dual-provider system. User chooses provider at checkout.

**Phase 0 (pre-launch):** бесплатное размещение для сторонних продавцов, комиссия платформы = **0%**. Монетизация через admin-агентов (`seller_id = NULL` → 100% платформе) + планируемый boost-promotion. Возврат к комиссионной модели — после launch, по решению.

### Pricing model

- `agents.price_monthly` / `price_onetime` = **seller price** (цена труда продавца, БЕЗ хостинга)
- `agents.compute_class` ∈ {S, M, L} → фикс. `compute_price` из `src/lib/compute.ts` (S=390₽, M=790₽, L=1690₽)
- **Покупатель платит:** `seller_price + compute_price` (total)
- **Продавец получает:** `sellerPayout(seller_price)` — на Phase 0 это **100% seller_price**
- **`compute_price` — passthrough платформы**, не участвует в split, полностью остаётся у платформы (компенсация хостинга)
- **Admin-агенты** (`seller_id = NULL`) — нет split, 100% total остаётся у платформы

Вся арифметика сосредоточена в `src/lib/compute.ts`: `totalPrice()`, `sellerPayout()`, `platformCommission()`. Провайдеры получают готовые цифры из checkout route и не пересчитывают сами. Чтобы вернуть комиссию — поменять `sellerPayout` и `platformCommission` в одном месте.

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

- **Checkout:** `POST /v3/payments` with `amount = total (seller + compute)`, `confirmation.type='redirect'`, `metadata={subscription_id, purchase_type, user_id, agent_id}`
- **Split:** `transfers=[{account_id: seller.yookassa_account_id, amount: {value: sellerPayout(seller_price), currency: 'RUB'}}]`. `compute_price` не попадает в `transfers` — остаётся на балансе платформы. Phase 0: `sellerPayout` = 100% `seller_price`. Admin agents (`seller_id = NULL`) — no transfers, 100% total остаётся платформе
- **Subscriptions:** No native recurring. Emulated via saved `payment_method_id`: first payment with `save_payment_method=true`, subsequent via cron job (`POST /v3/payments` with `payment_method_id`). Cron daily checks `subscriptions` where `expires_at < now() + 1 day`
- **Webhook:** `payment.succeeded` -> create/extend subscription. `payment.canceled` -> cancel. Verification: IP whitelist + header signature

## Cryptomus (crypto, international)

- **Checkout:** `POST /v1/payment` with `amount = total (seller + compute)`, `currency='USD'`, `order_id={subscription_uuid}`, `url_callback`, `url_success`
- **Subscriptions:** Native API `/v1/recurrence` — plan created at agent publication, user subscribes at checkout
- **Split:** No native split. All money to platform, after webhook confirmation programmatically payout `sellerPayout(seller_price)` (NOT total) to seller's `cryptomus_wallet_address` via `POST /v1/payout`. Phase 0: `sellerPayout` = 100% `seller_price`. `compute_price` остаётся у платформы. Idempotency via `provider_payment_id`
- **Webhook:** `payment.paid` -> create subscription + initiate payout (`sellerPayout(agent.price_monthly)`). `subscription.active` -> active. Verification: MD5 signature of body with API key

## Provider Selection

At checkout user sees the configured provider options. If exactly one provider is configured, the UI selects it automatically; if both are configured, the user chooses. Provider is stored in `subscriptions.payment_provider`.

## Activation

Payment activation is purely ENV-based. When YooKassa approves the application, add env vars to VPS — `providerEnvConfigured("yookassa")` returns true, `getProvider` returns real instance, `/api/checkout` switches from dev-stub to real checkout without code changes.

## NOT YET IMPLEMENTED / NOT ACTIVATED

- Real YooKassa `createSellerAccount` API call is still stubbed; current `/api/seller/onboarding` stores seller data or a manually pasted `yookassa_account_id`.
- Production activation still needs real YooKassa/Cryptomus env credentials on the VPS plus an end-to-end checkout/webhook smoke test.
- VPS scheduler still needs to call `/api/cron/yookassa-recurring` with `x-cron-secret` after YooKassa credentials are live.

## Lessons

*Empty — will be filled as mistakes happen.*
