-- One-shot backfill for subscriptions created before the seller_price snapshot column existed.
-- Safe to re-run: only touches rows where seller_price IS NULL.
-- After this runs, webhook payout code prefers sub.seller_price over agent.priceMonthly/priceOnetime,
-- protecting against sellers changing price between checkout and webhook firing.

UPDATE subscriptions s
SET seller_price = CASE
  WHEN s.purchase_type = 'subscription' THEN a.price_monthly
  WHEN s.purchase_type = 'one_time' THEN a.price_onetime
END
FROM agents a
WHERE s.agent_id = a.id
  AND s.seller_price IS NULL
  AND (
    (s.purchase_type = 'subscription' AND a.price_monthly IS NOT NULL) OR
    (s.purchase_type = 'one_time' AND a.price_onetime IS NOT NULL)
  );
