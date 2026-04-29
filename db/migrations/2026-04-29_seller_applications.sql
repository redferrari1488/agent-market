-- Phase 0: applications from prospective sellers go through manual moderation.
-- The form on /seller writes here; admin reviews on /admin/applications and
-- on approve flips the linked profile.role to 'seller' (when user_id is set).
-- Anonymous submitters (no account yet) are contacted via TG/email and
-- asked to register, after which the admin links their profile manually.

BEGIN;

CREATE TABLE IF NOT EXISTS seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  contact_email text NOT NULL,
  contact_telegram text,
  agent_description text NOT NULL,
  existing_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  decided_at timestamptz,
  decided_by text REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_applications_status     ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id    ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_created_at ON seller_applications(created_at);

COMMIT;
