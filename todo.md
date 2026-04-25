# TODO

> **Активная сессия: 2026-04-25** — hero shader (lock-in style) + остаток задач.

---

## SESSION 2026-04-25 — В очереди (после дизайна hero)

### Hero — PIVOTED (важно прочитать!)
**Не делаем WebGL шейдер.** Lock-in.agency используют простой `<video autoplay muted loop>` с зацикленным MP4 (1920×1080, 12 sec, 60fps), сгенерированным в **Google Veo**. Шейдеры мы пробовали в `output/hero-shader-mockup/` — три итерации (FBM noise / metaballs / sine displacement) — все мимо стиля lock-in. Оставлены как референс, можно удалить.

**Финальный план hero:**
- [ ] **Veo промпт готов** — `output/branding/veo-prompt.md`. Пользователь генерит 2–3 варианта в Google AI Studio → Build → Video Generation, выбирает лучший.
- [ ] Выбранный mp4 (~5–10 MB после сжатия) кладётся в `public/hero-bg.mp4` (+ webm + poster через ffmpeg, команды в veo-prompt.md).
- [ ] Интегрировать в hero как `<video>` поверх старой blob-canvas, удалить `HeroBlobCanvas` и `HeroDashboardMock`.
- [ ] Проверить `prefers-reduced-motion` — если включён, показывать только poster.
- [ ] Удалить `output/hero-shader-mockup/`, `output/lockin.html`, `output/lockin-hero-bg.mp4`, `output/lockin-hero-frame*.png` (рефы lock-in).

### Логотип / айдентика — PIVOTED (раньше было «отложено»)
Друг из lock-in посоветовал прогонять SVG лого через **3dsvg.design** для интерактивного 3D-знака (cursor parallax). Это меняет приоритет — лого теперь актуально.

**Сделано в этой сессии:**
- 4 SVG-варианта знака с cyan accent (`#22d3ee`):
  - `output/branding/logo-A-h-bracket.svg` — `< h >` в скобках (рекомендую)
  - `output/branding/logo-B-dot-bracket.svg` — `< · >` с точкой
  - `output/branding/logo-C-arrow-bracket.svg` — `< → >` со стрелкой
  - `output/branding/logo-D-monogram-h.svg` — solo «h» для favicon
- `output/branding/preview.html` — все варианты на тёмном фоне, на свете, на cyan, в формате lockup и mini-Header.

**Дальше:**
- [ ] Пользователь выбирает вариант (A / B / C / D или комбо).
- [ ] Загрузить выбранный SVG на **3dsvg.design**, настроить interaction (cursor parallax / depth / rotate), снять embed-код или экспортировать сцену.
- [ ] Положить SVG-знак в `public/logo.svg` (для Header), вариант D — в `public/favicon.svg` или `app/icon.svg` (Next.js auto-detect).
- [ ] Заменить текстовый logo в `src/components/layout/Header.tsx:117` на `<Image>` или inline SVG.
- [ ] В hero встроить 3D-версию из 3dsvg.design (либо через iframe, либо скачанный JS-сниппет — зависит от того, что отдаёт инструмент).

### UX cleanup (быстро)
- [ ] **Settings cleanup** — убрать `/dashboard/settings` из навигации (Header dropdown + mobile + dashboard CTA), перенести `DeleteAccountCard`. Вариант (A — collapsible на `/dashboard` / B — отдельный `/account/delete`) — нужно решить.
- [ ] **Onboarding copy** — переписать `/seller/onboarding` (заголовок «Настройка выплат», Cryptomus первой как «быстрый старт без оформления», YooKassa второй с пометкой «требуется ИП/ООО/самозанятость»), на `/seller` убрать жёлтую плашку «Setup payouts» или показывать только при наличии реальной продажи.

### Платежи (внешние блокеры)
- [ ] `yookassaProvider.createSellerAccount` — реальный `POST /v3/me` (после одобрения YK Marketplace)
- [ ] Cryptomus `createCheckout` — пробросить currency (сейчас hardcode `RUB` в `src/lib/payments/cryptomus.ts:90`)
- [ ] Email verification через Resend (ждём API key)
- [ ] Rename `cryptmusWalletAddress` → `cryptomusWalletAddress` (8 файлов, косметика)

### Отложено / не делаем
- Custom_build (друг из lock-in.agency публикуется как обычный агент)
- Логотип / айдентика
- Claude Managed Agents (MVP-1 модератор)
- Escrow/баланс при отсутствии онбординга (требует юриста)
- ENCRYPTION_KEY ротация
- CAPTCHA (заменили per-IP rate limiting)

---

## ARCHIVED — Session 2026-04-21 (security review, almost fully closed)

> Главная цель: **FULL SECURITY REVIEW + полная защита сайта перед продом.**
> Недельный лимит Claude ~25% — механику делегируем Codex, я ревьюю всё load-bearing (auth / payments / crypto / container isolation).

---

## SESSION 2026-04-21 — План

### Workflow (Claude ↔ Codex)

| Пишет код | Проверяет / решает |
|---|---|
| **Codex:** механика, boilerplate, Nginx конфиги, Zod-схемы по шаблону, rate-limit обвязка, rename | **Claude:** auth/sessions/cookies, payment webhooks, AES-KMS lifecycle, Docker escape surface, OAuth callback validation, SSRF/XSS/IDOR audit, итоговый go/no-go на прод |

**Правило:** каждый codex-коммит — я читаю diff, проверяю, запускаю typecheck/build, только потом push.

---

## Приоритет 1 — FULL SECURITY REVIEW (блокирует прод)

### 1.1 HTTP-заголовки и Nginx (→ Codex)

- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Nginx)
- [x] `X-Frame-Options: DENY` (или CSP frame-ancestors 'none')
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy` (отключить camera/microphone/geolocation/payment)
- [x] `Content-Security-Policy` — уже выставляется в `src/proxy.ts` с per-request nonce; в Nginx не дублируем, чтобы не сломать Telegram widget
- [x] Отключить `server_tokens` в Nginx (скрыть версию)
- [x] Ограничить размер тела: `client_max_body_size 1M` (кроме будущих upload-эндпоинтов)
- [x] TLS: отключить TLS 1.0/1.1, оставить 1.2/1.3, `ssl_ciphers` по Mozilla Intermediate
- [x] OCSP stapling, HTTP/2

**Я ревьюю** CSP после внедрения — это самый хрупкий заголовок, любая опечатка ломает виджет Telegram или next chunks.

### 1.2 Rate limiting и защита от abuse (→ смешанно)

- [x] **Codex:** rate-limit middleware (`@upstash/ratelimit` в in-memory режиме или собственный Map+TTL, редис не хочется ради одного use-case) для:
  - `/api/auth/**` — 10 req/min per IP
  - `/api/auth/telegram` — 20 req/min per IP
  - `/api/checkout` — 5 req/min per IP
  - `/api/seller/onboarding` — 3 req/min per IP
- [x] **Codex:** Nginx `limit_req_zone` на fallback уровне (если Next-middleware пропустит)
- [ ] **Claude:** решить, где хранить счётчики (in-memory на одном инстансе ок; если масштабирование — Postgres с TTL)
- [x] fail2ban на VPS для SSH — baseline в `infra/fail2ban/`, установлен и активирован на VPS (`infra/security/fail2ban-2026-04-21.md`)

### 1.3 Auth-hardening (→ Claude-heavy)

- [x] **Claude:** cookie-флаги: явно прописан `advanced.useSecureCookies` + `defaultCookieAttributes {sameSite:lax, httpOnly:true}` в `src/lib/auth.ts`
- [x] **Claude:** TOCTOU в `/api/auth/telegram`: разобрался — `profiles.telegramId` UNIQUE + `user.email` UNIQUE → race loser получает 500, но дублей нет. Acceptable.
- [x] **Claude:** `auth_date` check в verifyTelegramAuth: 24h → 60s
- [x] **Claude:** self-heal ветка в telegram route — пароль детерминированный от `BETTER_AUTH_SECRET`, перебор невозможен без знания секрета. + auth_date 60s ограничивает replay.
- [ ] **Codex:** Email-verification через Resend (когда пришлёт ключи) — использовать BetterAuth `emailVerification` plugin
- [ ] **Codex:** добавить CAPTCHA (Turnstile / hCaptcha) на форму email+password, если будем её оставлять - deferred, replaced by per-IP rate limiting in `src/proxy.ts`
- [x] **Claude:** `trustedOrigins` явно прописан в BetterAuth (защита от CSRF при misconfig). Allowlist OAuth redirectURIs нужно настроить в кабинетах Google/GitHub — внешний блокер.

### 1.4 Авторизация API-роутов (→ Claude)

- [x] **Claude:** все 23 API-роута проверены — auth-guard (getUser), role-check, ownership-check (`eq(...userId, user.id)` / `eq(...sellerId, user.id)`) на месте.
- [x] **Claude:** `/api/admin/**` — все три роута (stats, sellers/onboarding, agents/[id]/moderate) делают server-side `profile.role === 'admin'`.
- [x] **Claude:** mass-assignment отсутствует: `agentSchema` без `sellerId`, в POST `sellerId: user.id` берётся из сессии.
- [x] **Claude:** **B1 fix** — `/api/checkout` теперь блокирует dev-stub режим в проде (исключает выпуск бесплатных подписок при misconfig провайдера).

### 1.5 Input validation и DoS (→ смешанно)

- [x] **Codex:** пройтись по всем API-роутам и добавить Zod-схемы там где их нет (full sweep: из JSON-роутов без Zod оставался только `/api/auth/telegram`, схема добавлена)
- [x] **Claude:** size-limit на JSON body (`1MB`) — закрыто через Nginx `client_max_body_size 1M`
- [x] **Codex:** длины строк уже валидированы (name 100, description 300, long_description 10000, bio 500, review.text 2000)
- [x] **Claude:** ReDoS — все regex (slug, INN, TRC20 wallet) anchored и без вложенных квантификаторов. Чисто.
- [x] **Claude:** SSRF — server-side fetch user-provided URL отсутствует. avatar_url/photo_url — только в `<img src>`, fetch на стороне браузера.
- [x] **Claude:** **F2 fix** — `subscriptionConfigSchema` теперь имеет лимиты ключ ≤128, value ≤8KB, max 64 ключа.

### 1.6 Docker / изоляция агентов (→ Claude-heavy)

- [x] **Claude:** базовая изоляция в `src/lib/docker.ts`: `CapDrop:["ALL"]`, `SecurityOpt:["no-new-privileges:true"]`, `Memory/MemorySwap/NanoCpus/PidsLimit` уже стояли.
- [x] **Claude:** `User:1000:1000` + `ReadonlyRootfs:true` + `Tmpfs:/tmp` — включено для `content-writer` / `competitor-monitor` / `news-digest-bot` / `review-responder-2gis`; `website-monitor` оставлен исключением, smoke-test зафиксирован в `infra/security/trivy-remediation-2026-04-21.md`
- [x] **Claude:** network — дефолтный bridge (не host); `--privileged` не используется; docker socket не монтируется.
- [x] **Claude:** volume `/data` namespaced по subscriptionId (UUID), path traversal невозможен.
- [x] **Claude:** image scanning — baseline в `infra/security/trivy-2026-04-21.md`, remediation check в `infra/security/trivy-remediation-2026-04-21.md`; 5 shipped images clean on test rebuilds, `ai-support-bot` keeps one documented accepted-risk residual (`h11`, non-applicable to the current outbound-only runtime)
- [x] **Codex:** seccomp reviewed — keep Docker default profile; explicit `seccomp=default` is invalid on Docker 29 and would fail container creation
- [x] **Claude:** BYOK через env передаётся docker.createContainer.Env — на хосте видно через `docker inspect` (хост = мы). В логи не пишем (`console.error` без env-объектов). Утечка возможна только если сам агент-образ напечатает env (под нашим контролем для admin-агентов).

### 1.7 Платежи (→ Claude)

- [x] **Claude:** YooKassa CIDR актуален (April 19, 2026 sync) в `webhooks/yookassa/route.ts`.
- [x] **Claude:** Cryptomus HMAC — да, подпись MD5(base64(body)+API_KEY) проверяется (`cryptomus.ts:131-135`).
- [x] **Claude:** YooKassa Idempotence-Key (`recurring:<sub>:<utc_day>`) — провайдер-уровень дедупликации работает.
- [x] **Claude:** amount/currency — у нас `sellerPriceKopecks/computePriceKopecks` считаются server-side из `agents.price_monthly`. Webhook сохраняет провайдер-attested amount (IP/sig-locked). Безопасно.
- [x] **Claude:** split math — `Math.floor(sellerPrice * 0.88)`, копейки в пользу платформы (≤1 коп). Acceptable.
- [x] **Claude:** **C1 fix** — Cryptomus webhook теперь проверяет `existingSub.providerPaymentId === event.providerPaymentId` → idempotent skip (защита от duplicate payouts при ретрае Cryptomus).
- [x] **Claude:** **C2 fix** — YooKassa webhook больше НЕ сбрасывает `status` в `pending_setup` для already-active подписок (recurring webhook); transition только из pending/cancelled.

### 1.8 Шифрование и секреты (→ Claude)

- [ ] **Claude:** `ENCRYPTION_KEY` lifecycle — бэкап ключа есть локально; ротация = нужно перешифровать всё (deferred, документировано как acceptable risk для V1)
- [x] **Claude:** `.env` на VPS — `chmod 600` подтверждено; `docker-compose` не логирует env (наши docker-вызовы тоже).
- [x] **Codex:** `.env.example` с плейсхолдерами (собран из `docker-compose.yml`, `CLAUDE.md` и текущего local env; без реальных ключей в гите, `.env.local.example` синхронизирован)
- [x] **Claude:** AES-GCM — `randomBytes(12)` per encryption call (`encryption.ts:15`). Nonce уникален. Auth tag сохраняется отдельно.
- [x] **Claude:** **D2 fix** — `getKey()` теперь явно валидирует длину 32 байта (раньше падало с криптическим runtime error при misconfig).
- [x] **Claude:** `BETTER_AUTH_SECRET` длина — проверить на VPS вручную (нужно 32+ байта random hex).

### 1.9 Dependencies и supply-chain (→ Codex)

- [x] **Codex:** `npm audit --production` — отчёт добавлен в `infra/security/npm-audit-2026-04-21.md`, high/critical = 0, package diff не требуется
- [x] **Codex:** Dependabot/Renovate (GitHub settings) — weekly schedule
- [x] **Claude:** lockfile audit — pinned versions, нет unreviewed git-deps

### 1.10 Логи и observability (→ Claude)

- [x] **Claude:** grep по `console.*` — все логи только error-message строки, без токенов/ключей/cookies. Чисто.
- [x] **Claude:** agent_logs — таблица не экспонирована через API; докер-логи через `/api/subscriptions/[id]/logs` ownership-checked.
- [x] **Codex:** log rotation для docker logs (`max-size`, `max-file` в docker-compose)
- [x] **Claude:** health check endpoint — отсутствует, раскрытия нет.

### 1.11 Прочее

- [x] **Codex:** `/.well-known/security.txt` (contact, preferred-languages)
- [x] **Codex:** `/robots.txt` — разрешить каталог, запретить /admin, /api/, /seller/onboarding, `/dashboard/`, `/auth/`; `src/app/robots.ts` добавлен
- [x] **Claude:** open redirect — `successUrl/cancelUrl` строятся server-side из `NEXT_PUBLIC_APP_URL` + slug/id. `next` query из proxy.ts не используется в LoginForm (редирект жёстко на `/dashboard`). Чисто.
- [ ] **Claude:** account deletion endpoint — отдельная задача (deferred), privacy policy уже существует.

### 1.12 Финальный gate перед продом

**OWASP Top 10 чек:**
- A01 Broken Access Control — ✅ ownership/role checks на всех 23 API
- A02 Crypto — ✅ AES-256-GCM с random nonce + key length validation; HMAC-SHA256 для Telegram; BetterAuth bcrypt для паролей
- A03 Injection — ✅ Drizzle parameterized queries везде, нет raw SQL с user input
- A04 Insecure Design — ✅ payment authority server-side, BYOK через encrypted env, idempotent webhooks
- A05 Security Misconfig — ⚠️ зависит от Nginx (1.1, → Codex). Сам код OK.
- A07 Auth — ✅ BetterAuth + Telegram HMAC + auth_date 60s + trustedOrigins + secure cookies
- A08 Data Integrity — ✅ webhook idempotency, IP/sig binding на провайдерах
- A10 SSRF — ✅ нет server-side fetch user-provided URL

**Self-pentest:**
- [x] Подмена `sellerId` в форме — agentSchema без поля `sellerId` ⇒ невозможно
- [x] Отрицательная цена — `z.number().int().min(10000)` ⇒ отклонено
- [x] Webhook без подписи Cryptomus — возвращает `ignored: invalid signature`
- [x] Webhook YooKassa с чужого IP — 403 forbidden
- [x] Cron без секрета — 403 forbidden
- [x] IDOR `/api/seller/agents/:id` чужого продавца — `eq(agents.sellerId, user.id)` ⇒ 404
- [x] IDOR `/api/subscriptions/:id/*` чужой подписки — `eq(subscriptions.userId, user.id)` ⇒ 404
- [x] Бесплатная подписка через dev-stub — теперь блокируется в `NODE_ENV=production`
- [x] Двойной payout через ретрай Cryptomus webhook — теперь блокируется idempotency check

**Verdict:** ✅ server-side core is close, but prod gate is not fully green yet. Перед прод-релизом ОСТАЛОСЬ:
1. Push/deploy the rebuilt agent images and repo changes to prod
2. Email verify + CAPTCHA / rate-limit final decision (Resend key — внешний блокер)
3. Re-check `ai-support-bot` on the next Trivy round or after an upstream PTB 21.x-compatible dependency bump

---

## Приоритет 2 — Внешние блокеры (нужны от тебя)

- [x] Google + GitHub OAuth credentials → `.env` на VPS
- [ ] Resend API key → email verification
- [ ] YooKassa Marketplace — подать заявку (пока dev-stub)

---

## Приоритет 3 — Оставшиеся код-задачи

| Задача | Исполнитель | Примечание |
|---|---|---|
| `yookassaProvider.createSellerAccount` — реальный POST /v3/me | **Codex** пишет черновик, **Claude** ревьюит | Нужен после одобрения YooKassa Marketplace |
| Cryptomus `createCheckout` — end-to-end currency | **Codex** | Сейчас hardcode `RUB` (src/lib/payments/cryptomus.ts:90) |
| Rename `cryptmusWalletAddress` → `cryptomusWalletAddress` (8 файлов, JS-only) | **Codex** | Cosmetic |

---

## Приоритет 4 — Starter Agents: DONE

Все 6 стартовых агентов задеплоены и опубликованы (admin-owned, 100% платформе):

- [x] Telegram Support Bot
- [x] Content Writer
- [x] Competitor Monitor
- [x] Мониторинг сайтов (Website Monitor)
- [x] Новостной дайджест (News Digest Bot)
- [x] Ответы на отзывы 2GIS

**На завтра по агентам:** в рамках security-ревью (раздел 1.6) — прогнать Dockerfile / entrypoint / resource-limits каждого, проверить BYOK-флоу на утечку ключей в логи.

---

## Already done (для контекста на завтра)

- Telegram Login (commit 330ab32): deterministic HMAC password, asResponse cookies, self-heal для старых юзеров
- UI tweaks (commit 65f7adc): friendly display name (`@username`/`name` вместо `tg_<id>@telegram.local`), light theme default, fixed «как это устроено» hang (`next/link` → `<a>`)
- YooKassa recurring cron window [-24h, +24h] (commit 8fab0c7) — защита от downtime
- systemd timers (yookassa-recurring, cryptomus-payout-retry) с `chmod 600 .env`, ExecCondition non-empty, loopback curl, CRON_SECRET gate
- SSL hireon.agency (commit 52a2345), rebrand (commit 63eb676)
- Phase C core: ProviderPicker, onboarding flow, IP allowlist, split-math, compute-class UI warning, persistent /data volume

---

## Что НЕ делаем завтра

- Рефакторы ради рефакторов
- Новые фичи (каталог фильтров, реферальная программа, блог) — после прод-gate
- Миграции БД без явной необходимости

---

## Success criteria сессии

- [ ] Все пункты 1.1–1.12 закрыты (либо done, либо обоснованно «не применимо»)
- [ ] Self-pentest прогон пройден — ни одного high-severity findings
- [ ] Deploy на прод **только** после финального go
