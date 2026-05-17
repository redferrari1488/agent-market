-- Cryptomus → NowPayments миграция.
-- Phase 0 = 0 оборота, поэтому существующие данные можно безопасно
-- мигрировать: TRC-20 адрес (если был) переезжает в jsonb-структуру.

-- 1) profiles.cryptomus_wallet_address → profiles.crypto_wallets jsonb
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crypto_wallets jsonb;

UPDATE profiles
   SET crypto_wallets = jsonb_build_object('usdt_trc20', cryptomus_wallet_address)
 WHERE cryptomus_wallet_address IS NOT NULL
   AND crypto_wallets IS NULL;

ALTER TABLE profiles DROP COLUMN IF EXISTS cryptomus_wallet_address;

-- 2) agents.cryptomus_plan_id → agents.crypto_plan_id (нейтральное имя)
ALTER TABLE agents RENAME COLUMN cryptomus_plan_id TO crypto_plan_id;

-- 3) subscriptions.payment_provider CHECK constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_provider_check;

UPDATE subscriptions
   SET payment_provider = 'nowpayments'
 WHERE payment_provider = 'cryptomus';

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_payment_provider_check
  CHECK (payment_provider IN ('yookassa', 'nowpayments'));

-- 4) payouts.payment_provider CHECK constraint
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_payment_provider_check;

UPDATE payouts
   SET payment_provider = 'nowpayments'
 WHERE payment_provider = 'cryptomus';

ALTER TABLE payouts
  ADD CONSTRAINT payouts_payment_provider_check
  CHECK (payment_provider IN ('yookassa', 'nowpayments'));
