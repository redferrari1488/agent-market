-- ============================================
-- AI Agent Marketplace — Database Migration
-- ============================================

-- Таблица профилей (связана с auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,                          -- nullable: Telegram-юзер может не дать email
  name text,
  avatar_url text,
  role text DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  telegram_id bigint UNIQUE,                  -- для Telegram Login Widget
  telegram_username text,
  yookassa_account_id text,                   -- субаккаунт в YooKassa Маркетплейсе
  cryptomus_wallet_address text,              -- адрес кошелька для крипто-payout
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Агенты
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  long_description text,
  category text CHECK (category IN ('support', 'content', 'analytics', 'sales', 'monitoring')),
  pricing_model text DEFAULT 'subscription' CHECK (pricing_model IN ('subscription', 'one_time', 'both')),
  price_monthly int,                          -- в копейках RUB, обязательно если pricing_model IN ('subscription','both')
  price_onetime int,                          -- в копейках RUB, обязательно если pricing_model IN ('one_time','both')
  price_monthly_usd int,                      -- опц., центы USD для Cryptomus
  price_onetime_usd int,                      -- опц., центы USD для Cryptomus
  yookassa_product_id text,
  cryptomus_plan_id text,
  features jsonb DEFAULT '[]',
  setup_schema jsonb DEFAULT '[]',
  docker_image text,
  env_template jsonb DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  rating_avg float DEFAULT 0,
  rating_count int DEFAULT 0,
  purchases_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Подписки (и разовые покупки)
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  agent_id uuid REFERENCES agents(id),
  purchase_type text DEFAULT 'subscription' CHECK (purchase_type IN ('subscription', 'one_time')),
  payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  provider_subscription_id text,              -- для recurring
  provider_payment_id text,                   -- id платежа у провайдера
  amount int,                                 -- в минимальных единицах валюты
  currency text,                              -- 'RUB' | 'USD' | 'USDT' | ...
  status text DEFAULT 'pending_setup' CHECK (status IN ('pending_setup', 'active', 'paused', 'cancelled', 'expired')),
  container_id text,
  config jsonb DEFAULT '{}',                  -- зашифровано AES-256-GCM
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Отзывы
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  agent_id uuid REFERENCES agents(id),
  subscription_id uuid REFERENCES subscriptions(id),
  rating int CHECK (rating BETWEEN 1 AND 5),
  text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Логи агентов
CREATE TABLE agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id),
  message text,
  level text DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  created_at timestamptz DEFAULT now()
);

-- Выплаты продавцам
CREATE TABLE payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id),
  payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  amount int NOT NULL,
  currency text DEFAULT 'RUB',
  provider_transfer_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Индексы
-- ============================================
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_seller_id ON agents(seller_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_agent_id ON subscriptions(agent_id);
CREATE INDEX idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX idx_agent_logs_subscription_id ON agent_logs(subscription_id);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX idx_subscriptions_provider_payment_id ON subscriptions(provider_payment_id);
CREATE INDEX idx_subscriptions_provider_subscription_id ON subscriptions(provider_subscription_id);

-- ============================================
-- Constraint: цены обязательны в зависимости от pricing_model
-- ============================================
ALTER TABLE agents ADD CONSTRAINT agents_pricing_check CHECK (
  (pricing_model = 'subscription' AND price_monthly IS NOT NULL) OR
  (pricing_model = 'one_time' AND price_onetime IS NOT NULL) OR
  (pricing_model = 'both' AND price_monthly IS NOT NULL AND price_onetime IS NOT NULL)
);

-- ============================================
-- Trigger: автоматическое создание профиля при регистрации
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: обновление updated_at
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
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Profiles: юзер видит и редактирует свой профиль
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Agents: опубликованные видны всем, продавец видит свои
CREATE POLICY "Published agents visible to all" ON agents
  FOR SELECT USING (status = 'published');
CREATE POLICY "Sellers can manage own agents" ON agents
  FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Admins can manage all agents" ON agents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Subscriptions: юзер видит свои подписки
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reviews: все видят отзывы, юзер может создать/редактировать свой
CREATE POLICY "Reviews visible to all" ON reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Agent Logs: юзер видит логи своих подписок
CREATE POLICY "Users can view own logs" ON agent_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE id = subscription_id AND user_id = auth.uid())
  );

-- Payouts: продавец видит свои выплаты
CREATE POLICY "Sellers can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Admins can manage all payouts" ON payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Seed: 3 стартовых агента (seller_id нужно заменить на UUID админа)
-- ============================================
-- INSERT INTO agents (seller_id, slug, name, description, category, price_monthly, features, setup_schema, docker_image, status) VALUES
-- ('ADMIN_UUID', 'telegram-support-bot', 'Telegram Support Bot', 'AI-бот для поддержки клиентов в Telegram. Отвечает на вопросы 24/7 с использованием GPT и вашей базы знаний.', 'support', 1500, '["Ответы 24/7","Контекст из FAQ","Настраиваемый промпт","История диалогов"]', '[{"key":"telegram_token","label":"Telegram Bot Token","type":"password"},{"key":"system_prompt","label":"Инструкция для бота","type":"textarea"},{"key":"faq","label":"FAQ документ (опционально)","type":"textarea"},{"key":"openai_key","label":"OpenAI API Key","type":"password"}]', 'ghcr.io/agent-market/telegram-support:latest', 'published'),
-- ('ADMIN_UUID', 'content-writer', 'Content Writer', 'Автоматическая генерация контента по расписанию. Публикует посты в Telegram-канал с заданным тоном и тематикой.', 'content', 2000, '["Генерация по расписанию","Настраиваемый тон","Публикация в Telegram","GPT-4 качество"]', '[{"key":"topic","label":"Тематика","type":"text"},{"key":"tone","label":"Тон (деловой, casual, экспертный)","type":"text"},{"key":"schedule","label":"Расписание (например: каждый день 10:00)","type":"text"},{"key":"telegram_token","label":"Telegram Bot Token","type":"password"},{"key":"channel_id","label":"ID Telegram-канала","type":"text"},{"key":"openai_key","label":"OpenAI API Key","type":"password"}]', 'ghcr.io/agent-market/content-writer:latest', 'published'),
-- ('ADMIN_UUID', 'competitor-monitor', 'Competitor Monitor', 'Мониторинг сайтов конкурентов. Ежедневно парсит страницы, сравнивает изменения и присылает AI-саммари в Telegram.', 'monitoring', 2500, '["Ежедневный мониторинг","AI-саммари изменений","Отчёты в Telegram","Неограниченное количество URL"]', '[{"key":"urls","label":"URL конкурентов (по одному на строку)","type":"textarea"},{"key":"telegram_token","label":"Telegram Bot Token для отчётов","type":"password"},{"key":"chat_id","label":"Telegram Chat ID для отчётов","type":"text"},{"key":"openai_key","label":"OpenAI API Key","type":"password"}]', 'ghcr.io/agent-market/competitor-monitor:latest', 'published');
