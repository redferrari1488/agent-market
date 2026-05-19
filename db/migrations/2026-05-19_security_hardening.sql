-- Security hardening migration (audit 2026-05-19).
-- Применять через `psql $DATABASE_URL -f db/migrations/2026-05-19_security_hardening.sql`.
-- Phase 0 — 0 трафика, locking-cost минимальный.

-- M16: индексы под hot-path queries.
-- subscriptions(expires_at, status) — для cron yookassa-recurring (фильтр
-- active + window expiresAt ± 24h). Без него — full table scan.
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_status
  ON subscriptions (expires_at, status);

-- subscriptions(user_id) — частый фильтр в dashboard + ownership-check.
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions (user_id);

-- payouts(subscription_id) — для cascading queries и idempotency check
-- в nowpayments webhook.
CREATE INDEX IF NOT EXISTS idx_payouts_subscription_id
  ON payouts (subscription_id);

-- M11: уникальный constraint на (subscription_id, provider_transfer_id).
-- App-уровень дедупа в nowpayments/route.ts хрупкий при concurrent webhook
-- retry'ах — пусть БД гарантирует. partial unique для NOT NULL только.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payouts_sub_transfer
  ON payouts (subscription_id, provider_transfer_id)
  WHERE provider_transfer_id IS NOT NULL;

-- M19: CHECK constraints против отрицательных сумм. Zod-валидаторы на write
-- есть, но defense-in-depth на уровне БД ловит баги в business logic +
-- ручные обновления через psql / админку.
DO $$ BEGIN
  ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_amount_nonneg
    CHECK (amount IS NULL OR amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_seller_price_nonneg
    CHECK (seller_price IS NULL OR seller_price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE payouts
    ADD CONSTRAINT payouts_amount_nonneg
    CHECK (amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE agents
    ADD CONSTRAINT agents_price_monthly_nonneg
    CHECK (price_monthly IS NULL OR price_monthly >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE agents
    ADD CONSTRAINT agents_price_onetime_nonneg
    CHECK (price_onetime IS NULL OR price_onetime >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
