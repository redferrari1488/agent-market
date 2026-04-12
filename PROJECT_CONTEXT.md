# Project Context

## Current Goal
AI Agent Marketplace — маркетплейс готовых AI-агентов, работающих в Docker-контейнерах 24/7. Подробная архитектура в `CLAUDE.md`.

## Current Status (2026-04-12)

**Phase A — дизайн (ЗАВЕРШЁН):**
- Полный редизайн лендинга: product-first, editorial typography, asymmetric layouts, no AI-slop.
- Visual system: mono labels (`font-mono text-[11px] uppercase tracking-[0.15em]`), `border-border/40` cards, `bg-foreground text-background` CTA buttons, `rounded-lg`, no gradients/glow/backdrop-blur/glassmorphism.
- Hero: centered copy + HeroDashboardMock (buyer-facing mock с activity feed, stats row, streaming logs, sidebar с агентами).
- 21 файл вычищен от AI-slop (gradient text, glow blobs, violet decorations, backdrop-blur) — все страницы в едином стиле.
- Финальный cleanup: убраны developer-facing термины (Docker, визард, образ), все em dashes заменены на hyphens, fake tech metrics заменены на buyer-relevant.
- **Бэкап-тег перед редизайном:** `backup/phase-a-pre-redesign` на коммите `143611f`.

**Phase C — скелет платёжной системы (2026-04-11 вечер):**
- `src/lib/payments/provider.ts` — интерфейс `PaymentProvider`, типы `WebhookEvent` / `PayoutParams` / `CreateCheckoutParams`, `providerEnvConfigured()` для проверки env.
- `src/lib/payments/yookassa.ts` — реализация: createCheckout с split через transfers[] (85% продавцу на yookassa_account_id), handleWebhook для payment.succeeded/canceled, payoutToSeller throw (не используется — split через transfers), createSellerAccount throw (заглушка до интеграции). HTTP через fetch с Basic auth + Idempotence-Key. Сумма в рублях с двумя знаками, save_payment_method=true для подписок.
- `src/lib/payments/cryptomus.ts` — реализация: createCheckout (USD или RUB с автоконвертом), handleWebhook с верификацией MD5-подписи, payoutToSeller 85% на cryptomus_wallet_address через /v1/payout, cancelSubscription через /v1/recurrence/cancel.
- `src/lib/payments/index.ts` — `getProvider(name)` возвращает null если env не заполнен, `listAvailableProviders()` для ProviderPicker UI.
- `/api/checkout/route.ts` переписан: если provider передан И credentials есть → настоящий checkout (создаёт subscription, вызывает provider.createCheckout, возвращает `checkoutUrl`); иначе → dev-stub (subscription сразу в pending_setup без оплаты). YooKassa split получает `sellerYookassaAccountId` через инъекцию в agent object.
- `/api/webhooks/yookassa/route.ts` — принимает POST, парсит через provider.handleWebhook, обновляет subscriptions.
- `/api/webhooks/cryptomus/route.ts` — принимает POST, после payment.succeeded для not-admin агента инициирует payout 85% продавцу, пишет запись в payouts (pending/processing/completed/failed).

**Активация платежей = чисто ENV-работа.** Как только YooKassa одобрит заявку, на VPS в .env добавляется YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY / YOOKASSA_WEBHOOK_SECRET — `providerEnvConfigured("yookassa")` начинает возвращать true, `getProvider` возвращает реальный инстанс, /api/checkout переключается с dev-stub на настоящий checkout без правок кода. Аналогично для Cryptomus (CRYPTOMUS_MERCHANT_ID + API_KEY + PAYOUT_API_KEY + WEBHOOK_SECRET).

**Что ещё НЕ сделано в платежах (нужно доделать когда credentials появятся):**
- `/api/seller/onboarding` — не существует. YooKassa createSellerAccount throws, реальный онбординг нужно написать (форма с документами ИП/ООО/СЗ + POST /v3/me).
- ProviderPicker UI компонент — нужен в checkout, сейчас фронт вообще не передаёт `provider` в POST /api/checkout.
- Cron для recurring списаний YooKassa — нужен отдельный route, который раз в сутки смотрит subscriptions где expires_at < now()+1day и делает POST /v3/payments с payment_method_id.
- Верификация IP YooKassa в webhook route — сейчас только подпись.

## Previous Status (2026-04-11)

**Завершённые дни:**
- Day 1–4: лендинг, каталог, карточка агента, дашборд покупателя, Setup Wizard, AES-256-GCM шифрование, email OTP, отзывы, Header с user-меню, seed.sql с 3 агентами.
- Day 5: Docker agent management — src/lib/docker.ts (dockerode), API routes start/stop/restart/logs, LogViewer компонент с автообновлением.
- Day 7: Панель продавца — seller dashboard, AgentForm (create/edit), SetupSchemaBuilder, API CRUD, "стать продавцом", статистика.
- Day 8: Админка — модерация агентов (approve/reject), статистика платформы, API routes.
- Day 9: SEO metadata (все страницы), error/loading/not-found states, OG-теги.
- UI overhaul: глубокая тёмная тема (#06060a), glow-эффекты, glassmorphism, bento-grid лендинг, обновлённые AgentCard/Header/Footer.
- UI polish (2026-04-10): все внутренние страницы приведены к единому стилю deep dark + glow. Обновлены /agents (AgentFilters + hero glow), /agents/[slug] (AgentDetails + PurchaseButton с градиентом), /auth/login (glassmorphism card + gradient button), /dashboard (subscription cards с hover glow), /dashboard/agents/[id] (SetupWizard, ManageView, LogViewer), /seller (StatsCards, список агентов, BecomeSellerPage), /seller/agents/new + edit (AgentForm sections-as-cards, SetupSchemaBuilder), /admin (stats + ModerationCard).
- Auth fix: BetterAuth таблицы (user/session/account/verification) добавлены в Drizzle schema, databaseHooks для авто-создания profile при регистрации.
- **Day 6 стартован и поставлен на паузу (2026-04-11):** создан `agents-src/ai_provider.py` (универсальный переключатель Claude/OpenAI для своих агентов) и скаффолд `agents-src/ai-support-bot/` — обёртка над `father-bot/chatgpt_telegram_bot` (MIT) через clone-at-build подход. Dockerfile + entrypoint.sh (генерит config.yml + config.env из env-переменных, патчит upstream chat_modes.yml) + docker-compose.yml (bot + mongo, 256MB/0.5 CPU на каждый). Протестировано на VPS: билд прошёл, контейнеры стартуют, OpenAI-ключ рабочий, бот отвечает через Telegram. Обёртка функциональна. Дальнейшая работа над ботами приостановлена — решение ниже.

**Миграция на self-hosted (выполнено 2026-04-07):**
- Supabase полностью удалён (@supabase/ssr, @supabase/supabase-js, stripe).
- Установлены: drizzle-orm, drizzle-kit, pg, better-auth.
- Создана Drizzle-схема (src/lib/db/schema.ts) — все таблицы из CLAUDE.md.
- Создан Drizzle-клиент (src/lib/db.ts).
- BetterAuth настроен (src/lib/auth.ts) — Google OAuth, GitHub OAuth, email/password.
- BetterAuth API route (src/app/api/auth/[...all]/route.ts).
- Auth client (src/lib/auth-client.ts) — signIn, signUp, signOut, useSession.
- Auth server helper (src/lib/auth-server.ts) — getSession(), getUser().
- Все pages и API routes переписаны: supabase.from() → Drizzle запросы.
- middleware.ts переписан: BetterAuth session cookie вместо Supabase.
- LoginForm: email/password вместо OTP.
- OAuthButtons: BetterAuth signIn.social() вместо Supabase signInWithOAuth().
- TelegramLoginButton: убран Supabase verifyOtp, прямой вызов /api/auth/telegram.
- /auth/callback удалён (BetterAuth обрабатывает OAuth сам).
- Миграция SQL без RLS (db/migration.sql) — BetterAuth таблицы + бизнес-таблицы.
- seed.sql скопирован в db/seed.sql.
- Dockerfile (multi-stage, standalone Next.js).
- docker-compose.yml (postgres + app + nginx).
- nginx.conf (reverse proxy).
- next.config.ts: output: "standalone".
- drizzle.config.ts создан.
- npm run build — проходит успешно.

**Деплой на VPS (выполнено 2026-04-08):**
- Docker + Docker Compose установлены.
- Репо склонировано в /opt/agent-market.
- .env создан (BETTER_AUTH_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD сгенерированы).
- docker compose up -d — postgres + app + nginx работают.
- Сайт доступен по http://77.239.104.149 (публично) и http://100.79.2.56 (Tailscale).

## Active Decisions

### Архитектура
- **Self-hosted:** BetterAuth + Drizzle ORM + PostgreSQL в Docker. Supabase полностью удалён.
- **Auth:** BetterAuth (Google OAuth, GitHub OAuth, email/password, Telegram Login Widget).
- **ORM:** Drizzle ORM с node-postgres (pg).
- **БД:** PostgreSQL 16 в Docker, volume для данных, порт только localhost.
- **Деплой:** Docker Compose (postgres + next.js + nginx), всё на одном VPS.
- **RLS убран** — проверка прав в API routes через getUser() + db query.
- **Комиссия платформы:** 15%.
- **Цены в БД:** копейки RUB.

### VPS
- Провайдер: u1host (бывший AdminVPS отменён)
- Публичный IP: 77.239.104.149
- Tailscale IP: 100.79.2.56
- Ubuntu 24.04, kernel 6.8.0-79
- SSH: по ключу через Tailscale (root@100.79.2.56)
- Docker 29.4.0 + Compose 5.1.1
- Проект: /opt/agent-market

### Telegram Bot для Login Widget
- Бот создан: @agentmarket0_bot
- /setdomain не установлен (нужен домен/деплой)

## Active Decision (2026-04-11): сайт → боты, а не наоборот

Приостанавливаем работу над стартовыми ботами (Day 6) до того, как сайт будет **production-ready**. Причина: пустые кнопки, нерабочий OAuth, неотлаженные флоу = маркетплейс на сломанном фундаменте, даже если в бэке 6 идеальных агентов. Приоритет — сначала довести фронт до состояния «юзер может дойти от лендинга до оплаты без единой ошибки», потом уже наполнять каталог ботами.

Скаффолд `ai-support-bot` остаётся на VPS (`docker compose ps` в `/opt/agent-market/agents-src/ai-support-bot/` — бот + mongo работают, ресурсов ест минимум). Возвращаемся к нему после Day 10.

## Current Stage (2026-04-12)

**Phase A (дизайн) — завершён.** Следующий шаг — выбрать приоритет из оставшихся фаз:

**Что уже в репо и готово к активации:**
- Phase C скелет платежей — коммит `3534c11`. Активация = вписать ENV-переменные YooKassa/Cryptomus в `/opt/agent-market/.env` на VPS, никакого кода трогать не надо. Подробности — выше в разделе "Phase C".
- Phase D скаффолд AI Support Bot — работает на VPS в `/opt/agent-market/agents-src/ai-support-bot/`, не трогать.
- Бэкап-тег `backup/phase-a-pre-redesign` на коммите `143611f` — откат в любой момент: `git reset --hard backup/phase-a-pre-redesign`.

## План после дизайн-дня (в порядке приоритета)

1. **Phase B — внешние блокеры (ждут действий юзера):**
   - Покупка домена
   - SSL (Let's Encrypt + Nginx)
   - Google + GitHub OAuth credentials в .env
   - Telegram Login Widget (/setdomain у @BotFather для @agentmarket0_bot)
   - Email verification через Resend SMTP
   - YooKassa Маркетплейс — одобрение заявки

2. **Phase C — активация платежей + доделки (НЕ сам код провайдеров, он уже написан):**
   - Вписать ENV в VPS → dev-stub автоматически переключится на настоящий checkout
   - `/api/seller/onboarding` — форма с документами ИП/ООО/СЗ + POST `/v3/me` в YooKassa
   - `ProviderPicker` компонент в checkout UI (YooKassa vs Cryptomus) + фронт начинает передавать `provider` в POST `/api/checkout`
   - Cron для recurring списаний YooKassa (ежедневный route + cron на VPS)
   - IP allowlist YooKassa webhook
   - Retry-логика для failed Cryptomus payouts
   - Реальное end-to-end тестирование с тестовым магазином

3. **Phase D — достроить стартовый каталог ботов:**
   - #4 Website Monitor (обёртка changedetection.io, Apache 2.0)
   - #5 News Digest Bot (обёртка ESWZY/telegram-news, MIT)
   - #2 Content Writer (свой код ~150 строк + ai_provider.py)
   - #3 Competitor Monitor (свой код ~120 строк + ai_provider.py)
   - #6 Review Responder 2ГИС (свой код)

## Completed Phases

1. ~~SSH доступ к VPS~~ — через Tailscale.
2. ~~Деплой на VPS~~.
3. ~~Day 5~~ — docker.ts, API routes, LogViewer.
4. ~~Day 7~~ — панель продавца.
5. ~~Day 8~~ — админка.
6. ~~Day 9~~ — SEO, error/loading states, UI overhaul.
7. ~~UI polish~~ — 2026-04-10.
8. ~~Day 6 partial~~ — ai-support-bot scaffold протестирован (2026-04-11), поставлен на паузу.
9. ~~Phase A site polish~~ — dev checkout, legal pages, robots/sitemap, AgentGrid empty state, seed fix (kopecks).
10. ~~Phase C payment scaffolding~~ — готов к активации через ENV (2026-04-11 вечер).
11. ~~Phase A дизайн-день~~ — полный редизайн + visual unification + text cleanup (2026-04-12).

## Blockers

- YooKassa Маркетплейс: заявка не подана.
- Домен не куплен — без него нет SSL, Telegram Login и email verification.
- Google/GitHub OAuth credentials не настроены в .env на VPS (сайт работает, но OAuth-кнопки не функциональны).
- Email verification отключена — регистрация без подтверждения. Нужен SMTP (Resend) + домен.
- ~~UI polish не завершён~~ — завершено 2026-04-10, все страницы в едином стиле.

## Current Workflow
- Start work inside the project directory with `startproj`.
- End work inside the project directory with `endproj`.
- Sync between Windows and MacBook happens through normal git push/pull.

## Important Files
- `CLAUDE.md` — полная архитектура, схема БД, стек, флоу, стиль кода.
- `PROJECT_CONTEXT.md` — текущий статус, решения, блокеры (этот файл).
- `db/migration.sql` — каноническая схема БД (self-hosted, без RLS).
- `db/seed.sql` — 3 стартовых агента.
- `src/lib/db/schema.ts` — Drizzle ORM схема.
- `src/lib/auth.ts` — BetterAuth конфигурация.
- `docker-compose.yml` — Postgres + Next.js + Nginx.

## Notes For Claude And Codex
- Read `CLAUDE.md` and `PROJECT_CONTEXT.md` before making important changes.
- Supabase полностью удалён. Не используй @supabase/* пакеты.
- Auth: BetterAuth (src/lib/auth.ts). Сессии через getUser() из src/lib/auth-server.ts.
- БД: Drizzle ORM (src/lib/db.ts). Схема в src/lib/db/schema.ts.
- profiles.id — text (не uuid), ссылается на BetterAuth user.id.
