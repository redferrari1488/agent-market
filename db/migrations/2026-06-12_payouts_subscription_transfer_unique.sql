-- M2 аудита 2026-06-10: вебхук nowpayments переведён с select-then-insert на
-- ON CONFLICT DO NOTHING — конкурентные IPN-ретраи становятся тихим no-op
-- вместо 500 на unique violation.
--
-- Частичный индекс uq_payouts_sub_transfer (2026-05-19_security_hardening,
-- M11) уже гарантировал уникальность, но ON CONFLICT (cols) без предиката
-- partial-индекс не матчит. Заменяем на полный индекс (NULL transfer_id
-- и так различны для btree — поведение для NULL-строк не меняется),
-- его же объявляет Drizzle-схема. На момент миграции payouts пуста.

CREATE UNIQUE INDEX IF NOT EXISTS uq_payouts_subscription_transfer
  ON payouts (subscription_id, provider_transfer_id);

DROP INDEX IF EXISTS uq_payouts_sub_transfer;
