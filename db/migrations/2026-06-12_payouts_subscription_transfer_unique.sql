-- M2 аудита 2026-06-10: идемпотентность payout была select-then-insert без
-- констрейнта — два конкурентных IPN-ретрая NowPayments проходили проверку
-- оба и создавали дубль. Уникальный индекс переносит инвариант в БД,
-- вебхук вставляет через ON CONFLICT DO NOTHING.
-- NULL provider_transfer_id индекс не ограничивает (NULL != NULL).
-- На момент миграции payouts пуста (проверено 2026-06-12).

CREATE UNIQUE INDEX IF NOT EXISTS uq_payouts_subscription_transfer
  ON payouts (subscription_id, provider_transfer_id);
