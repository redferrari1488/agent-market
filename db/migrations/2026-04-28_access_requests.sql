-- Phase 0 pre-launch: waitlist for third-party agent cards.
-- Buyers cannot pay for seller_id IS NOT NULL agents in Phase 0 (422-FZ),
-- so the agent card shows "Запросить доступ" -> writes a row here.
-- Seller is notified (Telegram bot, task #6) and contacts the buyer outside
-- the platform. Trigger for opening IP / Phase 1: 20+ rows here.

BEGIN;

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  buyer_id text REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_email text NOT NULL,
  buyer_telegram text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_agent_id   ON access_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_buyer_id   ON access_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status     ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at);

COMMIT;
