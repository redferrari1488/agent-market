-- ============================================
-- Миграция: Stripe → YooKassa + Cryptomus + Telegram Auth
-- ============================================
-- Удаляем Stripe-специфичные поля, добавляем нейтральные provider_*
-- Добавляем Telegram Login и реквизиты обоих платёжных провайдеров

-- ========== profiles ==========
-- email может быть NULL (Telegram-юзер может не дать email; в auth.users ставим tg_{id}@telegram.local)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_connect_account_id,
  ADD COLUMN IF NOT EXISTS telegram_id bigint UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username text,
  ADD COLUMN IF NOT EXISTS yookassa_account_id text,       -- id субаккаунта в YooKassa Маркетплейсе
  ADD COLUMN IF NOT EXISTS cryptomus_wallet_address text;  -- адрес кошелька для payout

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);

-- ========== agents ==========
-- Цены теперь в копейках RUB (не центах USD). Опционально — параллельная цена в USD для Cryptomus.
ALTER TABLE agents
  DROP COLUMN IF EXISTS stripe_price_id,
  DROP COLUMN IF EXISTS stripe_price_id_onetime,
  ADD COLUMN IF NOT EXISTS price_monthly_usd int,          -- центы USD (опц.), для Cryptomus
  ADD COLUMN IF NOT EXISTS price_onetime_usd int,
  ADD COLUMN IF NOT EXISTS yookassa_product_id text,       -- id продукта в YooKassa
  ADD COLUMN IF NOT EXISTS cryptomus_plan_id text;         -- id подписочного плана в Cryptomus

-- ========== subscriptions ==========
ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  ADD COLUMN IF NOT EXISTS payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,  -- для recurring-подписок
  ADD COLUMN IF NOT EXISTS provider_payment_id text,       -- id платежа у провайдера
  ADD COLUMN IF NOT EXISTS amount int,                     -- сколько заплачено, в минимальных единицах
  ADD COLUMN IF NOT EXISTS currency text;                  -- 'RUB' | 'USD' | 'USDT' | ...

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_payment_id
  ON subscriptions(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id
  ON subscriptions(provider_subscription_id);

-- ========== payouts ==========
ALTER TABLE payouts
  DROP COLUMN IF EXISTS stripe_transfer_id,
  ADD COLUMN IF NOT EXISTS payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  ADD COLUMN IF NOT EXISTS provider_transfer_id text;

-- Базовая валюта теперь RUB (была 'usd')
ALTER TABLE payouts ALTER COLUMN currency SET DEFAULT 'RUB';
UPDATE payouts SET currency = 'RUB' WHERE currency = 'usd';
