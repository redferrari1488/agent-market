-- Waitlist для агентов без готового Docker image. Каталог показывает их со
-- статусом "Скоро", вместо кнопки покупки — форма email-интереса. Конвертирует
-- B2B-спрос в lead'ы для приоритизации разработки.

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS waitlist_only BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS agent_waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- partial unique чтобы один email не дублировался по одному агенту, но один
-- email может подписаться на разные waitlist'ы.
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_waitlist_agent_email
  ON agent_waitlist_signups (agent_id, lower(email));

CREATE INDEX IF NOT EXISTS idx_agent_waitlist_agent_id
  ON agent_waitlist_signups (agent_id);
