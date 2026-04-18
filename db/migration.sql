-- ============================================
-- AI Agent Marketplace — Self-hosted Migration
-- БЕЗ Supabase auth.users, БЕЗ RLS
-- BetterAuth создаёт свои таблицы (user, session, account, verification)
-- ============================================

-- ============================================
-- BetterAuth таблицы (создаются автоматически при первом запуске,
-- но определяем явно для контроля)
-- ============================================
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text,
  email text UNIQUE NOT NULL,
  "emailVerified" boolean DEFAULT false,
  image text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "account" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "accessToken" text,
  "refreshToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  password text,
  scope text,
  "idToken" text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- ============================================
-- Бизнес-таблицы
-- ============================================

CREATE TABLE profiles (
  id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  email text UNIQUE,
  name text,
  avatar_url text,
  role text DEFAULT 'buyer' NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  telegram_id bigint UNIQUE,
  telegram_username text,
  yookassa_account_id text,
  cryptomus_wallet_address text,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id text REFERENCES profiles(id),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  long_description text,
  category text CHECK (category IN ('support', 'content', 'analytics', 'sales', 'monitoring')),
  pricing_model text DEFAULT 'subscription' NOT NULL CHECK (pricing_model IN ('subscription', 'one_time', 'both')),
  price_monthly int,
  price_onetime int,
  price_monthly_usd int,
  price_onetime_usd int,
  yookassa_product_id text,
  cryptomus_plan_id text,
  features jsonb DEFAULT '[]',
  setup_schema jsonb DEFAULT '[]',
  docker_image text,
  env_template jsonb DEFAULT '{}',
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  rating_avg real DEFAULT 0 NOT NULL,
  rating_count int DEFAULT 0 NOT NULL,
  purchases_count int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES profiles(id),
  agent_id uuid NOT NULL REFERENCES agents(id),
  purchase_type text DEFAULT 'subscription' NOT NULL CHECK (purchase_type IN ('subscription', 'one_time')),
  payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  provider_subscription_id text,
  provider_payment_id text,
  amount int,
  currency text,
  status text DEFAULT 'pending_setup' NOT NULL CHECK (status IN ('pending_setup', 'active', 'paused', 'cancelled', 'expired')),
  container_id text,
  config jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES profiles(id),
  agent_id uuid NOT NULL REFERENCES agents(id),
  subscription_id uuid REFERENCES subscriptions(id),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, agent_id)
);

CREATE TABLE agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  message text,
  level text DEFAULT 'info' NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id text NOT NULL REFERENCES profiles(id),
  payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  amount int NOT NULL,
  currency text DEFAULT 'RUB',
  provider_transfer_id text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- Индексы
-- ============================================
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_seller_id ON agents(seller_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_agent_id ON subscriptions(agent_id);
CREATE INDEX idx_subscriptions_provider_payment_id ON subscriptions(provider_payment_id);
CREATE INDEX idx_subscriptions_provider_subscription_id ON subscriptions(provider_subscription_id);
CREATE INDEX idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX idx_agent_logs_subscription_id ON agent_logs(subscription_id);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);

-- ============================================
-- Compute class (классы вычислительных ресурсов Docker)
-- ============================================
ALTER TABLE agents ADD COLUMN IF NOT EXISTS compute_class text DEFAULT 'S' NOT NULL
  CHECK (compute_class IN ('S', 'M', 'L'));

-- Существующие агенты получают класс S по умолчанию (продавцы пересмотрят при редактировании).

-- ============================================
-- Constraint: цены обязательны в зависимости от pricing_model
-- ============================================
ALTER TABLE agents ADD CONSTRAINT agents_pricing_check CHECK (
  (pricing_model = 'subscription' AND price_monthly IS NOT NULL) OR
  (pricing_model = 'one_time' AND price_onetime IS NOT NULL) OR
  (pricing_model = 'both' AND price_monthly IS NOT NULL AND price_onetime IS NOT NULL)
);

-- ============================================
-- Trigger: обновление updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- seller_price snapshot (batch 1)
-- Фиксирует цену продавца в момент checkout,
-- защита от race при смене price_monthly до webhook.
-- ============================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS seller_price int;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS needs_cron boolean DEFAULT false NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_status text
  CHECK (onboarding_status IS NULL OR onboarding_status IN ('pending_review', 'approved', 'rejected'));
