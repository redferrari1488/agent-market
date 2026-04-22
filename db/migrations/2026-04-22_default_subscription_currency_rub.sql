BEGIN;

ALTER TABLE subscriptions
ALTER COLUMN currency SET DEFAULT 'RUB';

UPDATE subscriptions
SET currency = 'RUB'
WHERE currency IS NULL;

COMMIT;
