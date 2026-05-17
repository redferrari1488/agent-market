# Payments — Instruction Module

**READ THIS ENTIRE FILE before working on payment-related code.**

## Architecture

Dual-provider system. User chooses provider at checkout.

**Phase 0 (pre-launch):** бесплатное размещение для сторонних продавцов, комиссия платформы = **0%**. Монетизация через admin-агентов (`seller_id = NULL` → 100% платформе) + планируемый boost-promotion. Возврат к комиссионной модели — после launch, по решению.

### Pricing model

- `agents.price_monthly` / `price_onetime` = **цена для покупателя** (то что показано в карточке, то что списывается на checkout).
- `agents.compute_class` ∈ {XS, S, M, L} — **только Docker resource tier** (CPU / Memory / Disk limits для контейнера). В платёж НЕ добавляется. `priceKopecks` в `COMPUTE_CLASSES` оставлен как справочная стоимость хостинга для P&L аналитики.
- **Покупатель платит:** `price_monthly` / `price_onetime` ровно как в карточке. Никаких "+compute" наценок.
- **Продавец получает:** `sellerPayout(seller_price)` — на Phase 0 это **100% seller_price** (комиссия 0%).
- **Admin-агенты** (`seller_id = NULL`) — нет split, всё уходит платформе.
- **Будущая бизнес-модель** (когда вернутся сторонние продавцы): добавляется `platform_commission_percent` (per-seller или global). gross = `price_monthly`, платформа удерживает `gross * commission_percent`, seller получает остальное. Хостинг покрывается из комиссии, а не отдельной строкой для покупателя.

Арифметика в `src/lib/compute.ts` (`sellerPayout()`, `platformCommission()`) и `src/lib/payments/pricing.ts` (`resolveCheckoutPricing`).

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

- **Checkout:** `POST /v3/payments` with `amount = seller_price`, `confirmation.type='redirect'`, `metadata={subscription_id, purchase_type, user_id, agent_id}`
- **Split:** `transfers=[{account_id: seller.yookassa_account_id, amount: {value: sellerPayout(seller_price), currency: 'RUB'}}]`. Phase 0: `sellerPayout` = 100% `seller_price`. Admin agents (`seller_id = NULL`) — no transfers, всё остаётся платформе
- **Subscriptions:** No native recurring. Emulated via saved `payment_method_id`: first payment with `save_payment_method=true`, subsequent via cron job (`POST /v3/payments` with `payment_method_id`). Cron daily checks `subscriptions` where `expires_at < now() + 1 day`
- **Webhook:** `payment.succeeded` -> create/extend subscription. `payment.canceled` -> cancel. Verification: IP whitelist + header signature

## NowPayments (crypto, international)

Заменил Cryptomus в мае 2026 — у того FINTRAC CAD 177M штраф + TRM Labs о связях с подсанкционными биржами/CSAM, риск блокировки tainted USDT в P2P-площадках.

- **Checkout:** `POST /v1/invoice` с `price_amount = seller_price` (float), `price_currency='usd'` или `'rub'`, `order_id={subscription_uuid}`, `ipn_callback_url`, `success_url`, `cancel_url`. Header `x-api-key: <NOWPAYMENTS_API_KEY>`
- **Subscriptions:** **One-time only** в Phase 0. NowPayments Subscriptions API доступен (`/v1/subscriptions/plans`), но UX через email со ссылкой — не in-app. Включим, когда у ЮКассы заработает recurring (вместе)
- **Split:** Нет нативного split. Mass payout требует JWT+2FA — в Phase 0 `payoutToSeller` бросает not-implemented; webhook ловит и пишет `payouts.status='pending'` для ручной выплаты админом. Sellers хранят адреса в `profiles.crypto_wallets jsonb` (`{usdt_trc20?, usdc_sol?, btc?}`)
- **Webhook:** `payment_status='finished'` → `payment.succeeded`. `failed`/`expired`/`refunded` → `payment.failed`. Verification: header `x-nowpayments-sig` = `HMAC-SHA512(sortedJSON(body), NOWPAYMENTS_IPN_SECRET)` hex, сравнение через `timingSafeEqual`

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
