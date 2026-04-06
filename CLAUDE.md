# AI Agent Marketplace

## О проекте

Маркетплейс готовых AI-агентов. Не промпты, а работающие системы: покупатель выбирает агента, платит подписку или покупает одним платежом, проходит настройку, агент деплоится в Docker-контейнере и работает 24/7. Продавец сам выбирает модель монетизации своего агента: subscription, one_time или both (обе модели с разными ценами). Платформа берёт комиссию 15%. На старте — 3 своих агента + полная инфраструктура маркетплейса для сторонних продавцов.

**Целевой рынок:** РФ (основной) + зарубежные пользователи. Соответственно — два платёжных провайдера, юзер выбирает при оформлении.

## Стек

- Frontend: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, framer-motion
- Backend: Next.js API Routes (Route Handlers)
- БД: PostgreSQL через Supabase (бесплатный тир, до переезда на self-hosted после Day 10)
- Auth: Supabase Auth
  - Telegram Login Widget (custom flow через HMAC + Supabase admin API)
  - Google OAuth
  - GitHub OAuth
  - Email OTP (fallback)
- Платежи: dual-provider, выбор пользователем при оформлении
  - **YooKassa** (РФ) — split payments через Маркетплейс, комиссия 15%, subscription + one-time
  - **Cryptomus** (зарубеж/крипта) — USDT/BTC/ETH и др., subscription + one-time, комиссия 15% удерживается программно через payouts
- Деплой агентов: Docker-контейнеры, Docker Compose на VPS, управление через dockerode
- Хостинг фронта: Vercel (до Day 10) → собственный VPS (после Day 10)
- Валидация: Zod
- Иконки: lucide-react
- Шифрование конфигов: AES-256-GCM

## Структура БД (Supabase/PostgreSQL)

**Цены хранятся в минимальных единицах валюты (копейки для RUB, центы для USD).** Базовая валюта — RUB. Для Cryptomus цена конвертируется на лету по актуальному курсу, либо продавец задаёт отдельную USD-цену.

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  name text,
  avatar_url text,
  role text DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  telegram_id bigint UNIQUE,           -- для Telegram Login
  telegram_username text,
  yookassa_account_id text,            -- id субаккаунта продавца в YooKassa Маркетплейсе
  cryptomus_wallet_address text,       -- адрес кошелька продавца для payouts
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  long_description text,
  category text CHECK (category IN ('support', 'content', 'analytics', 'sales', 'monitoring')),
  pricing_model text DEFAULT 'subscription' CHECK (pricing_model IN ('subscription', 'one_time', 'both')),
  -- Цены в минимальных единицах (копейки RUB)
  price_monthly int,                   -- копейки, обязательно если pricing_model IN ('subscription','both')
  price_onetime int,                   -- копейки, обязательно если pricing_model IN ('one_time','both')
  price_monthly_usd int,               -- опционально, центы USD для Cryptomus (если NULL — конвертация на лету)
  price_onetime_usd int,               -- опционально, центы USD для Cryptomus
  -- YooKassa-специфичные идентификаторы (создаются при публикации агента)
  yookassa_product_id text,
  -- Cryptomus-специфичные (subscription plan id, если выбран subscription-режим)
  cryptomus_plan_id text,              -- id подписочного плана в Cryptomus для monthly
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

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  agent_id uuid REFERENCES agents(id),
  purchase_type text DEFAULT 'subscription' CHECK (purchase_type IN ('subscription', 'one_time')),
  -- Платёжный провайдер и его идентификаторы (нейтральная схема под оба)
  payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  provider_subscription_id text,       -- для subscription
  provider_payment_id text,            -- для one_time и для первого платежа подписки
  amount int,                          -- сколько заплачено, в минимальных единицах
  currency text,                       -- 'RUB' | 'USD' | 'USDT' | ...
  status text DEFAULT 'pending_setup' CHECK (status IN ('pending_setup', 'active', 'paused', 'cancelled', 'expired')),
  container_id text,
  config jsonb DEFAULT '{}',           -- зашифрованный AES-256-GCM конфиг юзера
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id),
  message text,
  level text DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id),
  payment_provider text CHECK (payment_provider IN ('yookassa', 'cryptomus')),
  amount int NOT NULL,
  currency text DEFAULT 'RUB',
  provider_transfer_id text,           -- id трансфера/payout в провайдере
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Индексы
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_agent_id ON subscriptions(agent_id);
CREATE INDEX idx_subscriptions_provider_payment_id ON subscriptions(provider_payment_id);
CREATE INDEX idx_subscriptions_provider_subscription_id ON subscriptions(provider_subscription_id);
CREATE INDEX idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX idx_agent_logs_subscription_id ON agent_logs(subscription_id);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);
```

RLS-политики: покупатель видит только свои subscriptions, logs, reviews. Продавец видит свои agents и payouts. Админ видит всё. Agents со статусом 'published' видны всем анонимно. Таблица profiles синхронизируется с auth.users через trigger on_auth_user_created.

## Структура проекта

```
/src/app
  /page.tsx                          — лендинг
  /agents/page.tsx                   — каталог с фильтрами, поиском, сортировкой
  /agents/[slug]/page.tsx            — карточка агента
  /dashboard/page.tsx                — дашборд покупателя
  /dashboard/agents/[id]/page.tsx    — управление агентом (логи, вкл/выкл, перенастройка)
  /seller/page.tsx                   — панель продавца
  /seller/agents/new/page.tsx        — создание нового агента
  /seller/agents/[id]/edit/page.tsx  — редактирование агента
  /seller/payouts/page.tsx           — история выплат
  /admin/page.tsx                    — админка
  /auth/callback/route.ts            — OAuth callback (Google, GitHub)
  /auth/telegram/route.ts            — Telegram Login верификация + создание сессии
  /api
    /checkout/route.ts               — создаёт checkout-сессию у выбранного провайдера
    /webhooks/yookassa/route.ts      — YooKassa webhooks
    /webhooks/cryptomus/route.ts     — Cryptomus webhooks
    /agents/route.ts                 — CRUD агентов
    /agents/[id]/reviews/route.ts    — CRUD отзывов
    /subscriptions/[id]/deploy/route.ts   — деплой контейнера
    /subscriptions/[id]/stop/route.ts     — остановка контейнера
    /subscriptions/[id]/restart/route.ts  — рестарт контейнера
    /subscriptions/[id]/logs/route.ts     — получение логов
    /seller/onboarding/route.ts      — онбординг продавца в выбранном провайдере
    /seller/stats/route.ts           — статистика продавца
    /admin/agents/[id]/moderate/route.ts — одобрить/отклонить агента

/src/components
  /layout/Header.tsx, Footer.tsx, Sidebar.tsx, ThemeToggle.tsx
  /auth/TelegramLoginButton.tsx, OAuthButtons.tsx
  /agents/AgentCard.tsx, AgentGrid.tsx, AgentFilters.tsx, AgentDetails.tsx
  /checkout/ProviderPicker.tsx       — выбор YooKassa / Cryptomus
  /dashboard/SubscriptionCard.tsx, LogViewer.tsx, SetupWizard.tsx, StatusBadge.tsx
  /seller/AgentForm.tsx, SetupSchemaBuilder.tsx, StatsCards.tsx, PayoutTable.tsx
  /admin/ModerationQueue.tsx, PlatformStats.tsx
  /ui/ — shadcn/ui компоненты

/src/lib
  /supabase.ts        — клиент Supabase
  /encryption.ts      — AES-256-GCM
  /validators.ts      — Zod-схемы
  /docker.ts          — dockerode: deploy/stop/restart/logs/status
  /payments
    /provider.ts      — интерфейс PaymentProvider
    /yookassa.ts      — реализация YooKassa
    /cryptomus.ts     — реализация Cryptomus
    /index.ts         — getProvider(name) → PaymentProvider
  /auth
    /telegram.ts      — верификация Telegram Login HMAC, создание Supabase-сессии

/src/middleware.ts
/src/hooks/useSubscriptions.ts, useAgentLogs.ts, useSellerStats.ts
```

## 3 стартовых агента (seller_id = NULL → админские)

### Telegram Support Bot — 1500₽/мес
Юзер даёт: Telegram Bot Token, системный промпт, FAQ-документ (опционально), OpenAI API Key. Агент слушает входящие сообщения, отвечает через OpenAI с контекстом из FAQ.

### Content Writer — 2000₽/мес
Юзер даёт: тематика, тон, расписание, Telegram Bot Token, ID канала, OpenAI API Key. Агент по расписанию генерирует пост через OpenAI и публикует в канал.

### Competitor Monitor — 2500₽/мес или 9900₽ разово
Юзер даёт: список URL конкурентов, Telegram Bot Token для отчётов, Chat ID, OpenAI API Key. Агент раз в день парсит страницы, GPT делает саммари изменений, шлёт отчёт в Telegram.

## Авторизация

**4 способа входа.** Все ведут к одной записи в `auth.users` / `profiles`:

1. **Telegram Login Widget** (приоритетный для РФ).
   - На странице `/login` виджет `<script src="https://telegram.org/js/telegram-widget.js?22" data-telegram-login="..." data-onauth="...">`.
   - Виджет возвращает `{id, first_name, username, photo_url, auth_date, hash}`.
   - POST на `/auth/telegram` → серверная верификация HMAC-SHA256 по `TELEGRAM_BOT_TOKEN` (см. https://core.telegram.org/widgets/login#checking-authorization).
   - Если `auth_date` старше 24 часов — отклонить.
   - Если верификация прошла: ищем профиль по `telegram_id`. Если есть — создаём Supabase-сессию через admin API (`supabase.auth.admin.generateLink` → magic link OR `createUser` + ручная сессия). Если нет — создаём нового юзера через `admin.createUser` с фейковым email `tg_{id}@telegram.local`, заполняем `telegram_id`/`telegram_username`/`avatar_url`.
   - Отдаём клиенту access/refresh токены → `supabase.auth.setSession()`.

2. **Google OAuth** — штатный Supabase flow (`signInWithOAuth({provider:'google'})` → callback `/auth/callback`).

3. **GitHub OAuth** — аналогично.

4. **Email OTP** — fallback, уже реализован в Day 4.

На `/login` — три кнопки OAuth (Telegram/Google/GitHub) + развёртываемая секция «Войти по email».

## Флоу покупателя

1. Лендинг → `/agents` → карточка агента → кнопка «Подключить».
2. Если не авторизован → `/login` (с return-URL).
3. Если `pricing_model='both'` — выбор тарифа (monthly / one-time).
4. **Выбор провайдера оплаты:** `ProviderPicker` с двумя картами — «Картой (₽)» (YooKassa) и «Криптовалютой» (Cryptomus). Юзер выбирает.
5. POST `/api/checkout` с `{agent_id, purchase_type, provider}` → сервер вызывает `getProvider(provider).createCheckout(...)` → возвращает URL для редиректа.
6. Юзер оплачивает у провайдера → редирект на `/dashboard?success=1`.
7. Webhook от провайдера создаёт subscription в статусе `pending_setup`.
8. Setup Wizard → конфиг → шифрование AES-256-GCM → `subscriptions.config`.
9. POST `/api/subscriptions/[id]/deploy` → Docker-контейнер запускается.
10. Дашборд: статус, логи, вкл/выкл/перенастроить.

## Флоу продавца

1. Регистрация → в профиле «Стать продавцом» → role меняется на seller.
2. Онбординг в платёжных провайдерах:
   - **YooKassa Маркетплейс:** создание субаккаунта продавца через API Маркетплейса (`POST /v3/me`, передача документов через нашу форму → YooKassa делает KYC) → `yookassa_account_id`.
   - **Cryptomus:** продавец указывает адрес своего крипто-кошелька для автопэйаута → `cryptomus_wallet_address`. Без KYC.
   - Минимум один из двух — обязателен. Можно оба.
3. `/seller/agents/new` — форма создания агента. При сабмите:
   - создаётся product в YooKassa (если у продавца есть YooKassa-аккаунт),
   - создаётся subscription plan в Cryptomus (если указан кошелёк и `pricing_model` включает subscription).
4. Статус `review` → админ одобряет → `published`.
5. `/seller` — статистика, выручка, график.
6. `/seller/payouts` — история выплат по обоим провайдерам (с фильтром по провайдеру).

## Флоу админа

1. `/admin` — очередь модерации.
2. Клик на агент → одобрить / отклонить с комментарием.
3. Статистика платформы: общая выручка по обоим провайдерам, комиссия, юзеры/продавцы/агенты/подписки.

## Docker-управление (src/lib/docker.ts)

dockerode для программного управления контейнерами на VPS. Каждый контейнер: имя `agent-{subscription_id}`, env vars = расшифрованный `config` юзера + `env_template` агента, restart policy `unless-stopped`, лимиты 256MB RAM + 0.5 CPU. Функции: `deployContainer`, `stopContainer`, `restartContainer`, `getContainerLogs(tail=100)`, `getContainerStatus` → `running|stopped|error`.

## Платёжные провайдеры

### Единый интерфейс (src/lib/payments/provider.ts)

```typescript
interface PaymentProvider {
  name: 'yookassa' | 'cryptomus';

  createCheckout(params: {
    agent: Agent;
    purchaseType: 'subscription' | 'one_time';
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string; providerRefId: string }>;

  handleWebhook(body: unknown, headers: Headers): Promise<WebhookEvent>;

  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  createSellerAccount?(seller: Profile, kycData?: unknown): Promise<string>;
}
```

### YooKassa (РФ, split payments)

**Маркетплейс.** Используется продукт «YooKassa Маркетплейс» (требует заявки и одобрения — подать заранее). После одобрения: платформа — родительский shop, каждый продавец — субаккаунт (создаётся через API `/v3/me`). KYC продавцов делает сам YooKassa.

**Checkout.** `POST https://api.yookassa.ru/v3/payments` с `amount`, `confirmation.type='redirect'`, `metadata={subscription_id, purchase_type, user_id, agent_id}`.

**Split (комиссия 15%).** Для каждого платежа передаётся массив `transfers`:
- Для not-admin продавца: `transfers=[{account_id: seller.yookassa_account_id, amount: {value: price*0.85, currency: 'RUB'}}]`. Остальные 15% остаются на балансе платформы.
- Для админских агентов (seller_id NULL): без transfers, 100% платформе.

**Подписки.** YooKassa нет нативного recurring. Эмулируется через сохранённый `payment_method_id`: первый платёж с `save_payment_method=true`, последующие — автосписания через cron-job на нашем backend (`POST /v3/payments` с `payment_method_id`). Cron раз в сутки смотрит `subscriptions` где `purchase_type='subscription' AND expires_at < now() + 1 day` и делает автосписание.

**Webhook.** `payment.succeeded` → создание/продление subscription. `payment.canceled` → отмена. Верификация через IP-whitelist YooKassa + проверка подписи в заголовке.

### Cryptomus (крипта, интернациональный)

**Checkout.** `POST https://api.cryptomus.com/v1/payment` с `amount`, `currency='USD'` (или RUB с автоконвертом), `order_id={subscription_uuid}`, `url_callback`, `url_success`. Возвращает `url` — редирект юзера.

**Подписки.** Нативный API `/v1/recurrence` — создаётся subscription plan при публикации агента, юзер при checkout подписывается на план, Cryptomus сам списывает каждый месяц с его Cryptomus-баланса.

**Split (комиссия 15%).** Нативного split нет. Логика: все деньги идут платформе, после подтверждения webhook мы программно инициируем payout 85% на `cryptomus_wallet_address` продавца через `POST /v1/payout`. Идемпотентность — через `provider_payment_id`.

**Webhook.** `payment.paid` → создание subscription + inicjacja payout продавцу (если seller != admin). `subscription.active` → `active`. Верификация через MD5-подпись тела запроса с API key (см. доки Cryptomus).

### Выбор провайдера

На checkout юзер видит обе опции. Предвыбор — по `Accept-Language` / гео (RU → YooKassa), но явно переключается. Провайдер записывается в `subscriptions.payment_provider`.

## Безопасность

- Конфиги юзеров: AES-256-GCM, ключ в `ENCRYPTION_KEY`, расшифровка только в момент деплоя.
- RLS на все таблицы Supabase.
- Webhook-верификация: YooKassa — IP + подпись, Cryptomus — MD5 sign. Оба через отдельные `*_WEBHOOK_SECRET`.
- Telegram Login: HMAC-SHA256, `auth_date` < 24h.
- Docker-образы на старте — только из доверенных registry.
- Rate limiting на API routes.
- Zod-валидация всех входящих данных.
- Middleware для проверки ролей на `/seller/*`, `/admin/*`, `/dashboard/*`.

## Дизайн

- Тёмная тема по дефолту, переключатель light/dark в Header.
- shadcn/ui как база компонентов.
- Цвета: фон `#0a0a0f`, карточки `#12121a`, бордеры `#1e1e2e`, акцент — градиент `from-violet-600 to-blue-500`.
- Карточки агентов: иконка категории (lucide), название, описание 2 строки, цена/мес, рейтинг, бейдж категории, счётчик покупок.
- Лендинг: hero + «как это работает» (3 шага) + популярные агенты + секция для продавцов.
- Mobile-first.
- framer-motion: появление при скролле, hover, переходы.
- Skeleton + empty states.

## Стиль кода

- TypeScript strict mode.
- Server Components по дефолту, `'use client'` только для интерактива.
- Zod-схемы в `src/lib/validators.ts`.
- Все async в try/catch, понятные ошибки юзеру.
- API response: `{ data: T }` или `{ error: string, code: number }`.
- Переиспользуемые хуки в `/src/hooks`.
- Комментарии на русском в местах со сложной бизнес-логикой.

## Переменные окружения (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
TELEGRAM_BOT_TOKEN=

# Платежи — YooKassa
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_WEBHOOK_SECRET=

# Платежи — Cryptomus
CRYPTOMUS_MERCHANT_ID=
CRYPTOMUS_API_KEY=
CRYPTOMUS_PAYOUT_API_KEY=
CRYPTOMUS_WEBHOOK_SECRET=

# Инфраструктура
DOCKER_HOST=ssh://user@vps-ip
ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## План работы

**Дни 1–4 — готово** (см. git log: лендинг, каталог, карточка агента, дашборд, Setup Wizard, шифрование, email OTP, отзывы).

**Далее:**

- **Шаг 1 (сейчас):** обновить CLAUDE.md под новые решения — ✅ этот документ.
- **Шаг 2:** миграция БД `stripe_*` → `provider_*` + новые поля (telegram_id, yookassa/cryptomus).
- **Шаг 3 (Auth):** Google + GitHub OAuth + Telegram Login Widget (HMAC + admin API).
- **Шаг 4 (Day 5, Docker):** `lib/docker.ts`, подключить к API deploy/stop/restart/logs, LogViewer с автообновлением.
- **Шаг 5 (Платежи):** `lib/payments/{provider,yookassa,cryptomus}.ts`, переписать `/api/checkout`, webhook handlers. Запускается когда YooKassa Маркетплейс одобрит заявку.
- **Day 6:** Docker-образы для 3 агентов, локальное тестирование.
- **Day 7:** Панель продавца + конструктор setup_schema + онбординг в провайдерах.
- **Day 8:** Админка + модерация + статистика.
- **Day 9:** E2E-тестирование, error states, SEO, полировка.
- **Day 10:** Деплой фронта на Vercel (временно), VPS для Docker-контейнеров.
- **Пост-Day-10:** переезд фронта и Postgres на собственный VPS (self-hosted Supabase или голый Postgres + Lucia/BetterAuth), Nginx + Certbot, домен.

## Важно помнить

- Комиссия платформы — **15%**, удерживается автоматически при split.
- Админские агенты (seller_id = NULL) → 100% платформе, без split.
- Цены в БД — в копейках RUB. USD-цены опциональны (для Cryptomus — иначе конвертация на лету).
- При переезде на self-hosted после Day 10 — auth мигрирует с Supabase Auth на Lucia/BetterAuth, схема БД остаётся.
