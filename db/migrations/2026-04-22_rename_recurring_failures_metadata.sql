BEGIN;

UPDATE subscriptions
SET config = (config - 'recurring_failures') || jsonb_build_object(
  '_meta_recurring_failures',
  COALESCE(config -> '_meta_recurring_failures', config -> 'recurring_failures')
)
WHERE jsonb_typeof(config) = 'object'
  AND config ? 'recurring_failures';

COMMIT;
