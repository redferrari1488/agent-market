-- Follow-up к 2026-05-19_security_hardening.sql. M10 — добавили amount/currency
-- equality-check в webhook'ах, но логическая race остаётся: два webhook'а с
-- разным provider_payment_id для одной подписки в принципе могли пройти,
-- если cron уже обновил между ними. Partial unique гарантирует, что любой
-- конкретный provider_payment_id живёт в БД ровно в одной строке.
--
-- Recurring не ломается: каждый месяц cron создаёт новый payment_id,
-- subscription держит только последний. Старые payment_id'ы переезжают в
-- agent_logs / audit_logs, но в subscriptions их нет.

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_provider_payment_id
  ON subscriptions (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
