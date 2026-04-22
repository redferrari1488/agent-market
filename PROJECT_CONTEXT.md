# Project Context

## Current Goal
AI Agent Marketplace — маркетплейс готовых AI-агентов, работающих в Docker-контейнерах 24/7. Подробная архитектура в `CLAUDE.md`.

## Current Status (2026-04-22 - Checkout/account hardening)

**Local follow-up batch after security closeout (committed in parts, not pushed):**
- Closed the HTTP/IP fallback gap in `infra/nginx/nginx.conf`: plain HTTP on the raw IP now redirects to `https://hireon.agency`, ACME challenge stays reachable over HTTP, and a dedicated `443 default_server` rejects SNI mismatch traffic. Verification is recorded in `infra/security/http-redirect-fix.md`.
- Normalized checkout currency handling across the payment flow: checkout now resolves the real payment currency explicitly, Cryptomus no longer hardcodes RUB, subscription snapshots store amount/sellerPrice/currency in the actual charge currency, legacy subscriptions default to `RUB`, and seller/admin revenue views aggregate by currency instead of mixing RUB and USD.
- Added self-service account deletion: `POST /api/account/delete` now requires re-auth, soft-deletes profiles via `deleted_at`, writes `audit_logs`, cancels the user subscriptions, removes Docker container/volume artifacts, deletes BetterAuth provider accounts/sessions, and exposes the flow in `/dashboard` plus `/privacy`.
- Follow-up review fix before deploy: `src/lib/auth-server.ts` now treats soft-deleted profiles as signed-out for all server routes, and `/api/account/delete` explicitly bypasses BetterAuth cookie cache plus clears auth cookies in the response so deleted accounts cannot linger behind the 5-minute session cache.
- Latest local verification for the account-deletion batch is green: `npx tsc --noEmit` and `npm run build` both pass. The build still needs unrestricted network because `next/font` fetches Google Fonts during production build.

## Current Status (2026-04-22 - Security closeout)

**Security closeout continuation (local, committed in parts, not pushed):**
- Recorded an internal accepted-risk decision for `ai-support-bot` in `infra/security/trivy-remediation-2026-04-21.md`: the remaining `h11` `CVE-2025-43859` is treated as non-applicable for the current marketplace runtime because the container does not expose an inbound HTTP listener and operates as an outbound client to Telegram + AI APIs.
- Reassessment trigger for that residual finding is explicit: rerun on the next Trivy review or when upstream can move off `python-telegram-bot==20.1` to a dependency chain that permits `httpcore 1.x` / `h11 0.16+`.
- Gate 3 closed: internal `subscriptions.config` metadata now uses the `_meta_` prefix, recurring payment failures moved to `_meta_recurring_failures`, legacy `recurring_failures` stays readable during rollout, and a one-off SQL migration was added under `db/migrations/`.

## Previous Status (2026-04-21 - Security continuation)

**Security continuation after Claude handoff (build-verified, not pushed):**
- Added build-time `NEXT_PUBLIC_APP_URL` propagation in `Dockerfile` / `docker-compose.yml` and removed the unsafe localhost fallback from `src/app/sitemap.ts`; this fixes the prod `sitemap.xml` leak once deployed.
- Adjusted Nginx fallback `limit_req` zones to stay looser than the app-layer proxy limits instead of duplicating them one-to-one.
- Added `infra/fail2ban/jail.local` + README; initial check found `fail2ban.service` missing, and the later install/enable is recorded below.
- Added `infra/security/secrets-check-2026-04-21.md`; checked the VPS and confirmed `BETTER_AUTH_SECRET` exists once and is 64 hex chars.
- Added `infra/security/encryption-key-rotation.md`.
- Added `infra/security/trivy-2026-04-21.md` and `npm run scan:images`; the initial baseline scan found HIGH findings across shipped images and a CRITICAL Python finding (`h11`) in `ai-support-bot-bot:latest`.
- Added `infra/security/trivy-remediation-2026-04-21.md`: rebuilt test images for `content-writer`, `competitor-monitor`, `news-digest-bot`, `review-responder-2gis`, and `website-monitor` scan clean after Dockerfile remediation; `ai-support-bot` keeps one documented accepted-risk residual (`h11`) because upstream still pins the older PTB/httpcore chain.
- Installed and enabled `fail2ban` on the VPS; verification recorded in `infra/security/fail2ban-2026-04-21.md`.
- Fixed `src/lib/docker.ts` so agent deploys decrypt per-key values from `subscriptions.config` and skip internal recurring-failure metadata instead of passing encrypted values through to containers.
- Enabled stricter runtime hardening in `src/lib/docker.ts` for the four shipped single-container Python agents: `User 1000:1000`, `ReadonlyRootfs`, and `Tmpfs /tmp`. `website-monitor` remains the documented exception.
- Verified locally with `npx tsc --noEmit` and `npm run build`.
- Verified on VPS Docker `29.4.0` that `seccomp=default` is invalid (`open default: no such file or directory`), so the code intentionally keeps Docker's default seccomp profile instead of writing a broken explicit option.

## Previous Status (2026-04-21 - earlier session)

**Security wrap-up after 1.x review (build-verified, ready to push/deploy):**
- Security review 1.x закрыт: nginx/CSP/rate-limit headers были смёржены раньше, эта сессия закрыла remaining wrap-up без payment-heavy правок.
- `cryptmus*` typo убран из JS/TS-слоя: `cryptomusWalletAddress` и `cryptomusPlanId` теперь консистентны, без миграции БД и без переименования SQL-колонок.
- Добавлен `.github/dependabot.yml`: weekly updates для npm, github-actions и docker по всем `agents-src/*`; major bumps для `next`, `react`, `react-dom`, `drizzle-orm` игнорируются.
- В `src/lib/docker.ts` явно задокументировано, что используем дефолтный Docker seccomp профиль и намеренно НЕ передаём `seccomp=unconfined`.
- На `/auth/login` добавлен Cloudflare Turnstile для email/password auth через официальный BetterAuth captcha plugin. Graceful degradation есть: без `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET` форма работает как раньше.
- Продовый mobile Telegram flow проверен через Playwright mobile emulation: fallback-ссылка ведёт на `oauth.telegram.org` с корректным `return_to=/auth/telegram-callback`. После проверки найдено, что desktop-only widget всё ещё грузился на mobile и ловил CSP errors — это исправлено server-side UA gate, на mobile теперь показывается только fallback-ссылка.

**What still blocks a fully production-ready launch:**
- Нужны реальные `GOOGLE_CLIENT_ID/SECRET` и `GITHUB_CLIENT_ID/SECRET` на VPS, иначе social OAuth остаётся выключенным.
- Нужны реальные `TURNSTILE_SITE_KEY` и `TURNSTILE_SECRET` на VPS, иначе CAPTCHA код задеплоен, но фактически не активен.
- Нужна ручная проверка на реальном телефоне после деплоя: `oauth.telegram.org` -> `/auth/telegram-callback` -> `/dashboard` с живой Telegram-сессией.
- Email verification всё ещё не включена: нужен провайдер почты (например, Resend) и интеграция verification flow.
- Платежи для полноценного прода всё ещё зависят от внешних блокеров: реальные OAuth/payment credentials, YooKassa Marketplace approval и финальный E2E checkout/proxy/webhook smoke test на проде.

## Current Status (2026-04-15)

**Design polish pass + safety backup (local, build verified):**
- РЎРѕР·РґР°РЅ РїРѕР»РЅС‹Р№ Р»РѕРєР°Р»СЊРЅС‹Р№ backup РїСЂРѕРµРєС‚Р° РґРѕ РґР°Р»СЊРЅРµР№С€РёС… РїСЂР°РІРѕРє: `C:\Users\artem\__BACKUPS__\AGENT-MARKET__FULL-BACKUP__2026-04-15__00-22-41`.
- `src/components/dev/PaletteSwitcher.tsx` РґРѕР±Р°РІР»РµРЅ РєР°Рє dev-only palette switcher СЃ runtime CSS overrides; РјРѕРЅС‚РёСЂСѓРµС‚СЃСЏ РІ root layout С‚РѕР»СЊРєРѕ РїСЂРё `NODE_ENV === "development"`.
- `src/app/globals.css` РїРѕРґРЅСЏР» РєРѕРЅС‚СЂР°СЃС‚ dark theme С‡РµСЂРµР· РЅРѕРІС‹Рµ `foreground`, `muted-foreground`, `border` Рё related foreground tokens.
- `src/components/landing/LandingAnimations.tsx` РїРѕС‡РёС‰РµРЅ РѕС‚ buyer-facing tech jargon, СѓР±СЂР°РЅ stale `meta` render bug Рё leftover glow blob; `npm run build` СЃРЅРѕРІР° РїСЂРѕС…РѕРґРёС‚.
- `src/components/agents/AgentCard.tsx` СѓСЃРёР»РµРЅ: checklist С„РёС‡, `Новый` state, more informative footer strip.

**Post-polish hardening (same day, lint/build clean):**
- РџРѕР»РЅС‹Р№ `npm run lint` С‚РµРїРµСЂСЊ Р·РµР»С‘РЅС‹Р№: РїРѕС‡РёС‰РµРЅС‹ unused imports/vars, legacy warnings Рё React hook lint errors.
- Theme mount gating РїРµСЂРµРІРµРґРµРЅ РЅР° `src/hooks/use-mounted.ts` С‡РµСЂРµР· `useSyncExternalStore` в `ThemeProvider`/`ThemeToggle`, Р±РµР· `setState` РІ `useEffect`.
- Next 16 deprecation Р·Р°РєСЂС‹С‚: `src/middleware.ts` РїРµСЂРµРЅРµСЃС‘РЅ РІ `src/proxy.ts`, export `middleware` -> `proxy`, build warning РёСЃС‡РµР·.
- `src/lib/auth.ts` С‚РµРїРµСЂСЊ РїРѕРґРєР»СЋС‡Р°РµС‚ Google/GitHub providers С‚РѕР»СЊРєРѕ РєРѕРіРґР° env credentials Р·Р°РґР°РЅС‹, РїРѕСЌС‚РѕРјСѓ local build Р±РµР· ложных BetterAuth warnings.
- `.env.local.example` РїРµСЂРµРїРёСЃР°РЅ РїРѕРґ С‚РµРєСѓС‰РёР№ self-hosted stack (BetterAuth/DB/Docker/YooKassa/Cryptomus), Р±РµР· legacy Supabase/Stripe variables.

**Landing follow-up (same day, targeted redesign + test controls):**
- `src/components/landing/LandingAnimations.tsx` rebuilt only in the sections called out as weak: hero, buyer path, post-launch benefits, and seller copy. `HeroDashboardMock` and the payout card stay as anchors.
- Homepage metadata in `src/app/page.tsx` now describes the product as ready-made business agents instead of a generic AI marketplace.
- `src/components/dev/PaletteSwitcher.tsx` is temporarily mounted for on-site visual testing in all environments via `src/app/layout.tsx`; the floating trigger is now explicitly labeled `Палитра`.

## Current Status (2026-04-14)

**Pricing model B+C + compute classes (deployed):**
- Новая модель: `agents.price_monthly/price_onetime` = цена труда продавца (БЕЗ хостинга). Покупатель платит `seller_price + compute_price`. Комиссия **12%** берётся ТОЛЬКО с `seller_price` — compute passthrough, остаётся у платформы.
- `agents.compute_class` ∈ {S, M, L} — добавлен в схему, default `S`. Классы определены в `src/lib/compute.ts` (`COMPUTE_CLASSES`, `totalPrice()`, `sellerPayout()`, `platformCommission()`).
- S=390₽ (0.25 CPU, 256 MB), M=790₽ (0.5 CPU, 512 MB, 1 GB disk), L=1690₽ (1 CPU, 1 GB, 5 GB disk, cron).
- Checkout route, yookassa/cryptomus провайдеры, seller/admin статистика, dashboard, catalog и agent page — всё переведено на модель B+C.
- `src/lib/docker.ts` — compute limits реально применяются: `Memory`, `NanoCpus`, `PidsLimit`, `MemorySwap=Memory` (swap выключен) — из `COMPUTE_CLASSES[class].{memoryMb,cpu}`.
- Ночная ветка `backup/compute-windows-night` — альтернативный драфт с `sub.seller_price` и Cryptomus USD, идеи перенесены в `todo.md` (Phase C2).

## Previous Status (2026-04-13)

**Project reorganization (2026-04-13):**
- CLAUDE.md restructured: slimmed from 32KB monolith to focused core (~4KB) with routing table
- Created `instructions/` with 5 modules: coding.md, design.md, payments.md, docker.md, agents-build.md
- Created `lessons.md` (self-learning system) and `todo.md` (task tracking)
- Created global `~/.claude/CLAUDE.md` with cross-project rules
- Initialized Memory system with MEMORY.md index + user_profile.md + project_architecture.md
- All detailed specs (DB schema details, payment flows, agent catalog, auth flows) moved from CLAUDE.md to instruction modules

## Previous Status (2026-04-12)

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
- **Комиссия платформы:** 12% (только с seller_price, compute — passthrough).
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
