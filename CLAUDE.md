# AI Agent Marketplace

## О проекте

Маркетплейс готовых AI-агентов. Не промпты, а работающие системы: покупатель выбирает агента, платит подписку, проходит настройку, агент деплоится в Docker-контейнере и работает 24/7. Продавцы публикуют своих агентов, платформа берёт комиссию 25%. На старте — 3 своих агента + полная инфраструктура маркетплейса для сторонних продавцов.

## Стек

- Frontend: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, framer-motion
- Backend: Next.js API Routes (Route Handlers)
- БД: PostgreSQL через Supabase (бесплатный тир)
- Auth: Supabase Auth (email + Google OAuth)
- Платежи: Stripe Connect (split payments — комиссия 25% платформе, 75% продавцу; для своих агентов 100% платформе)
- Деплой агентов: Docker-контейнеры, Docker Compose на VPS, управление через dockerode
- Хостинг фронта: Vercel
- Валидация: Zod
- Иконки: lucide-react
- Шифрование конфигов: AES-256-GCM

## Структура БД (Supabase/PostgreSQL)

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  role text DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  stripe_customer_id text,
  stripe_connect_account_id text,
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
  price_monthly int NOT NULL, -- в центах (1500 = $15.00)
  stripe_price_id text, -- Stripe Price ID для подписки
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
  stripe_subscription_id text,
  status text DEFAULT 'pending_setup' CHECK (status IN ('pending_setup', 'active', 'paused', 'cancelled', 'expired')),
  container_id text,
  config jsonb DEFAULT '{}',
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
  amount int NOT NULL,
  currency text DEFAULT 'usd',
  stripe_transfer_id text,
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
CREATE INDEX idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX idx_agent_logs_subscription_id ON agent_logs(subscription_id);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
```

RLS-политики: покупатель видит только свои subscriptions, logs, reviews. Продавец видит свои agents и payouts. Админ видит всё. Agents со статусом 'published' видны всем анонимно. Таблица profiles синхронизируется с auth.users через trigger on_auth_user_created.

## Структура проекта

```
/src/app
  /page.tsx                          — лендинг (hero + как это работает + популярные агенты + секция для продавцов)
  /agents/page.tsx                   — каталог с фильтрами по категории, поиск, сортировка по цене/рейтингу
  /agents/[slug]/page.tsx            — карточка агента (описание markdown, фичи, цена, отзывы, кнопка покупки)
  /dashboard/page.tsx                — дашборд покупателя (мои агенты, статусы)
  /dashboard/agents/[id]/page.tsx    — управление агентом (логи, вкл/выкл, перенастройка)
  /seller/page.tsx                   — панель продавца (статистика, выручка, активные подписки)
  /seller/agents/new/page.tsx        — создание нового агента (форма + конструктор setup_schema)
  /seller/agents/[id]/edit/page.tsx  — редактирование агента
  /seller/payouts/page.tsx           — история выплат
  /admin/page.tsx                    — админка (модерация, юзеры, статистика платформы)
  /auth/callback/route.ts            — OAuth callback
  /api
    /checkout/route.ts               — Stripe Checkout Session с split payment
    /webhooks/stripe/route.ts        — обработка: checkout.session.completed, invoice.paid, customer.subscription.deleted
    /agents/route.ts                 — CRUD агентов для продавцов
    /agents/[id]/reviews/route.ts    — CRUD отзывов
    /subscriptions/[id]/deploy/route.ts   — деплой контейнера
    /subscriptions/[id]/stop/route.ts     — остановка контейнера
    /subscriptions/[id]/restart/route.ts  — рестарт контейнера
    /subscriptions/[id]/logs/route.ts     — получение логов
    /seller/connect/route.ts         — Stripe Connect онбординг продавца
    /seller/stats/route.ts           — статистика продавца
    /admin/agents/[id]/moderate/route.ts — одобрить/отклонить агента

/src/components
  /layout/Header.tsx, Footer.tsx, Sidebar.tsx, ThemeToggle.tsx
  /agents/AgentCard.tsx, AgentGrid.tsx, AgentFilters.tsx, AgentDetails.tsx
  /dashboard/SubscriptionCard.tsx, LogViewer.tsx, SetupWizard.tsx, StatusBadge.tsx
  /seller/AgentForm.tsx, SetupSchemaBuilder.tsx, StatsCards.tsx, PayoutTable.tsx
  /admin/ModerationQueue.tsx, PlatformStats.tsx
  /ui/ — shadcn/ui компоненты

/src/lib
  /supabase.ts        — клиент Supabase (createServerClient + createBrowserClient)
  /stripe.ts          — Stripe + Stripe Connect хелперы
  /docker.ts          — dockerode: deployContainer, stopContainer, restartContainer, getContainerLogs, getContainerStatus
  /encryption.ts      — AES-256-GCM шифрование/дешифрование конфигов
  /validators.ts      — Zod-схемы для всех API routes

/src/middleware.ts          — проверка auth + ролей для /seller/*, /admin/*, /dashboard/*

/src/hooks
  /useSubscriptions.ts
  /useAgentLogs.ts
  /useSellerStats.ts
```

## 3 стартовых агента (seller_id = admin)

### Telegram Support Bot — $15/мес
Юзер даёт: Telegram Bot Token, системный промпт, FAQ-документ (опционально). Агент слушает входящие сообщения, отвечает через OpenAI с контекстом из FAQ. Docker: Python + python-telegram-bot + openai. setup_schema: [{ key: "telegram_token", label: "Telegram Bot Token", type: "password" }, { key: "system_prompt", label: "Инструкция для бота", type: "textarea" }, { key: "faq", label: "FAQ документ (опционально)", type: "textarea" }, { key: "openai_key", label: "OpenAI API Key", type: "password" }]

### Content Writer — $20/мес
Юзер даёт: тематика, тон, расписание (cron-выражение), Telegram-канал или webhook URL. Агент по расписанию генерирует пост через OpenAI, отправляет в канал. Docker: Python + openai + schedule + python-telegram-bot. setup_schema: [{ key: "topic", label: "Тематика", type: "text" }, { key: "tone", label: "Тон (деловой, casual, экспертный)", type: "text" }, { key: "schedule", label: "Расписание (например: каждый день 10:00)", type: "text" }, { key: "telegram_token", label: "Telegram Bot Token", type: "password" }, { key: "channel_id", label: "ID Telegram-канала", type: "text" }, { key: "openai_key", label: "OpenAI API Key", type: "password" }]

### Competitor Monitor — $25/мес
Юзер даёт: список URL конкурентов, email или Telegram для отчётов. Агент раз в день парсит страницы, сравнивает с предыдущей версией, GPT делает саммари изменений, шлёт отчёт. Docker: Python + beautifulsoup4 + openai + requests. setup_schema: [{ key: "urls", label: "URL конкурентов (по одному на строку)", type: "textarea" }, { key: "telegram_token", label: "Telegram Bot Token для отчётов", type: "password" }, { key: "chat_id", label: "Telegram Chat ID для отчётов", type: "text" }, { key: "openai_key", label: "OpenAI API Key", type: "password" }]

## Флоу покупателя

1. Заходит на сайт → лендинг с hero, объяснением "как это работает" (3 шага: выбери → подключи → работает), каталог популярных агентов
2. /agents — полный каталог с фильтрами по категории и сортировкой по цене/рейтингу
3. Кликает на агента → /agents/[slug] — подробное описание (markdown), список фич, цена, отзывы покупателей, кнопка "Подключить"
4. "Подключить" → Stripe Checkout (monthly subscription, split payment если продавец не админ)
5. После оплаты → redirect на /dashboard, подписка создана в статусе "pending_setup"
6. Setup Wizard — динамическая форма построенная из setup_schema агента (поля: text, textarea, password, select). Конфиг шифруется AES-256-GCM и сохраняется в subscriptions.config
7. "Запустить" → POST /api/subscriptions/[id]/deploy → Docker-контейнер поднимается с env vars из расшифрованного конфига + env_template агента
8. Дашборд: карточка агента со статусом (работает/остановлен/ошибка), логи с автообновлением, кнопки вкл/выкл/перенастроить

## Флоу продавца

1. Регистрация как buyer → в профиле кнопка "Стать продавцом" → role меняется на seller → Stripe Connect Standard onboarding → stripe_connect_account_id сохраняется
2. /seller/agents/new — форма создания: название, slug (авто из названия), описание, long_description (markdown-редактор), категория, цена ($/мес), Docker-образ (ссылка на registry), setup_schema (визуальный конструктор полей: добавить поле → key, label, type), env_template, список фич
3. Сабмит → агент создаётся со статусом "review"
4. Админ в /admin просматривает → одобряет (статус "published") или отклоняет с комментарием (статус "rejected")
5. /seller — дашборд: мои агенты (с статусами), общее кол-во покупок, выручка за период, график продаж
6. /seller/payouts — история выплат через Stripe Connect

## Флоу админа

1. /admin — очередь модерации (агенты в статусе "review"), список одним взглядом
2. Клик на агент → просмотр всех полей → кнопки "Одобрить" / "Отклонить" с полем для комментария
3. Статистика платформы: общая выручка, комиссия платформы, кол-во юзеров/продавцов/агентов/активных подписок

## Docker-управление (src/lib/docker.ts)

Используй dockerode для программного управления контейнерами на VPS. Каждый контейнер: имя `agent-{subscription_id}`, env vars собираются из расшифрованного config юзера + env_template агента, restart policy unless-stopped, лимиты 256MB RAM + 0.5 CPU. Функции: deployContainer(subscriptionId) — собирает env, запускает контейнер, записывает container_id в subscription; stopContainer(subscriptionId) — останавливает и удаляет контейнер; restartContainer(subscriptionId) — stop + deploy; getContainerLogs(subscriptionId, tail=100) — последние N строк логов; getContainerStatus(subscriptionId) — running/stopped/error.

## Stripe Connect — маркетплейс-платежи

При Stripe Checkout Session (mode: 'subscription'): если seller_id != admin → subscription_data.application_fee_percent = 25, subscription_data.transfer_data.destination = seller.stripe_connect_account_id. Если seller_id = admin → обычный checkout без split. При создании агента — автоматически создаётся Stripe Price (recurring/month) и stripe_price_id сохраняется в agents. Webhook обрабатывает: checkout.session.completed (создание subscription), invoice.paid (продление), customer.subscription.deleted (отмена → остановка контейнера).

## Безопасность

- Конфиги юзеров шифруются AES-256-GCM, ключ в ENCRYPTION_KEY env var, расшифровка только в момент деплоя контейнера
- RLS-политики на все таблицы в Supabase
- Stripe webhook верификация через stripe.webhooks.constructEvent с STRIPE_WEBHOOK_SECRET
- Docker-образы от продавцов на старте только из доверенных registry (позже — скан на безопасность)
- Rate limiting на API routes (next-rate-limit или middleware)
- Zod-валидация всех входящих данных на каждом API route
- Middleware для проверки ролей на /seller/*, /admin/* маршрутах

## Дизайн

- Тёмная тема по дефолту, переключатель light/dark в Header
- shadcn/ui как база всех компонентов
- Цвета: фон #0a0a0f, карточки #12121a, бордеры #1e1e2e, акцент — градиент from-violet-600 to-blue-500
- Карточки агентов: иконка категории (lucide), название, короткое описание (2 строки max), цена/мес, рейтинг звёздами, бейдж категории, счётчик покупок
- Лендинг: hero с крупным заголовком + подзаголовком + CTA "Смотреть агентов", секция "Как это работает" (3 шага с иконками), сетка популярных агентов, секция "Для продавцов" с CTA
- Mobile-first адаптивный дизайн
- framer-motion: появление карточек при скролле, hover-эффекты, плавные переходы страниц
- Loading states: skeleton-компоненты для карточек и таблиц
- Empty states: иллюстрация + текст + CTA для пустого дашборда/каталога

## Стиль кода

- TypeScript strict mode (strict: true в tsconfig)
- Server Components по дефолту, 'use client' только для интерактивных компонентов
- Zod-схемы для валидации всех API routes, экспортировать из src/lib/validators.ts
- Все async-операции обёрнуты в try/catch с понятными ошибками для юзера
- API routes возвращают единообразный формат: { data: T } или { error: string, code: number }
- Переиспользуемые хуки в /src/hooks
- Комментарии на русском в местах со сложной бизнес-логикой

## Переменные окружения (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
DOCKER_HOST=ssh://user@vps-ip
ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Инициализация проекта

```bash
npx create-next-app@latest agent-market --typescript --tailwind --app --src-dir --import-alias "@/*"
cd agent-market
npm install @supabase/supabase-js @supabase/ssr stripe zod lucide-react framer-motion dockerode
npm install -D @types/dockerode
npx shadcn@latest init
```

## План работы — 10 дней

День 1: Next.js проект + Supabase (таблицы, RLS) + Auth (email, Google OAuth) + базовый layout (Header с навигацией и ThemeToggle, Footer) + тёмная тема.

День 2: Лендинг (hero, как это работает, популярные агенты, секция для продавцов). Каталог /agents с фильтрами по категории, поиском, сортировкой. Карточка агента /agents/[slug] с описанием, фичами, ценой, отзывами.

День 3: Stripe Connect онбординг для продавцов. Stripe Checkout Session с split payment и комиссией 25%. Webhook handler: checkout.session.completed → создание subscription в статусе pending_setup. Webhook handler: invoice.paid → продление. Webhook handler: customer.subscription.deleted → отмена + остановка контейнера.

День 4: Дашборд покупателя /dashboard — список купленных агентов с статусами. Setup Wizard — динамическая форма из setup_schema. Шифрование конфига AES-256-GCM и сохранение. Страница управления /dashboard/agents/[id] — статус, логи, вкл/выкл. Система отзывов (только для купивших, рейтинг 1-5, пересчёт rating_avg) — нужна для страницы агента из Дня 2.

День 5: lib/docker.ts через dockerode — все функции (deploy, stop, restart, logs, status). API routes для деплоя/остановки/рестарта/логов. Полный флоу: Setup Wizard → деплой контейнера → статус active. LogViewer с автообновлением.

День 6: Docker-образы для 3 агентов (Telegram Support Bot, Content Writer, Competitor Monitor). Dockerfile для каждого. Локальное тестирование. Seed-данные: 3 агента в таблице agents со статусом published.

День 7: Панель продавца /seller — статистика, выручка, графики. Форма создания агента /seller/agents/new с конструктором setup_schema. Редактирование /seller/agents/[id]/edit. История выплат /seller/payouts.

День 8: Админка /admin — очередь модерации, одобрение/отклонение агентов с комментарием, статистика платформы, управление юзерами.

День 9: End-to-end тестирование всех флоу. Обработка ошибок, loading/empty states, skeleton-компоненты. SEO: метатеги, OG-изображения, sitemap.xml. Полировка UI, edge cases.

День 10: Деплой фронта на Vercel. Настройка VPS: Docker, Docker Compose, SSL. Подключение домена. Финальное тестирование на проде. README.
