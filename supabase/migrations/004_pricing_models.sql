-- Поддержка двух моделей монетизации: подписка и разовая покупка
-- Продавец может выставить только одну или обе сразу

-- price_monthly становится опциональным (может быть только one_time агент)
ALTER TABLE agents ALTER COLUMN price_monthly DROP NOT NULL;

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'subscription'
    CHECK (pricing_model IN ('subscription', 'one_time', 'both')),
  ADD COLUMN IF NOT EXISTS price_onetime int,
  ADD COLUMN IF NOT EXISTS stripe_price_id_onetime text;

-- Подписки теперь хранят и разовые покупки
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS purchase_type text DEFAULT 'subscription'
    CHECK (purchase_type IN ('subscription', 'one_time')),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Проверка: если pricing_model = 'subscription' → price_monthly обязательно
-- если 'one_time' → price_onetime обязательно
-- если 'both' → оба обязательны
ALTER TABLE agents ADD CONSTRAINT agents_pricing_check CHECK (
  (pricing_model = 'subscription' AND price_monthly IS NOT NULL) OR
  (pricing_model = 'one_time' AND price_onetime IS NOT NULL) OR
  (pricing_model = 'both' AND price_monthly IS NOT NULL AND price_onetime IS NOT NULL)
);
