# TODO

> **Следующая сессия: 2026-04-21** — главная цель: **FULL SECURITY REVIEW + полная защита сайта перед продом.**
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

- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Nginx)
- [ ] `X-Frame-Options: DENY` (или CSP frame-ancestors 'none')
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` (отключить camera/microphone/geolocation)
- [ ] `Content-Security-Policy` — строгий, но с учётом Telegram widget (`https://oauth.telegram.org`), inline-скрипта виджета, шрифтов Google, next.js чанков
- [ ] Отключить `server_tokens` в Nginx (скрыть версию)
- [ ] Ограничить размер тела: `client_max_body_size 1M` (кроме будущих upload-эндпоинтов)
- [ ] TLS: отключить TLS 1.0/1.1, оставить 1.2/1.3, `ssl_ciphers` по Mozilla Intermediate
- [ ] OCSP stapling, HTTP/2

**Я ревьюю** CSP после внедрения — это самый хрупкий заголовок, любая опечатка ломает виджет Telegram или next chunks.

### 1.2 Rate limiting и защита от abuse (→ смешанно)

- [ ] **Codex:** rate-limit middleware (`@upstash/ratelimit` в in-memory режиме или собственный Map+TTL, редис не хочется ради одного use-case) для:
  - `/api/auth/**` — 10 req/min per IP
  - `/api/auth/telegram` — 20 req/min per IP
  - `/api/checkout` — 5 req/min per user
  - `/api/seller/onboarding` — 3 req/min per user
- [ ] **Codex:** Nginx `limit_req_zone` на fallback уровне (если Next-middleware пропустит)
- [ ] **Claude:** решить, где хранить счётчики (in-memory на одном инстансе ок; если масштабирование — Postgres с TTL)
- [ ] fail2ban на VPS для SSH (если не настроен) — `Claude` проверяет, `Codex` пишет конфиг

### 1.3 Auth-hardening (→ Claude-heavy)

- [ ] **Claude:** аудит всех cookie-флагов BetterAuth: `Secure`, `HttpOnly`, `SameSite=Lax`/`Strict`. Проверить что в проде действительно `Secure` выставлен (`baseURL https://...`)
- [ ] **Claude:** проверить TOCTOU в `/api/auth/telegram`: между findFirst и signUpEmail есть окно гонки. Добавить unique constraint handling (INSERT ... ON CONFLICT DO NOTHING на profile)
- [ ] **Claude:** `auth_date` check в verifyTelegramAuth сейчас 24h — сократить до 60 секунд (стандарт для Login Widget)
- [ ] **Claude:** self-heal ветка в telegram route (updatePassword) — добавить лимит попыток, чтобы нельзя было триггерить ресет пароля перебором
- [ ] **Codex:** Email-verification через Resend (когда пришлёт ключи) — использовать BetterAuth `emailVerification` plugin
- [ ] **Codex:** добавить CAPTCHA (Turnstile / hCaptcha) на форму email+password, если будем её оставлять
- [ ] **Claude:** при настройке Google/GitHub OAuth — жёсткий allowlist `redirectURIs`, проверить что callback на `hireon.agency/api/auth/callback/*`

### 1.4 Авторизация API-роутов (→ Claude)

- [ ] **Claude:** пройтись по каждому `src/app/api/**/route.ts`, сверить:
  - auth-guard (getUser) есть?
  - role-check (buyer/seller/admin) корректный?
  - IDOR: `agentId`/`subscriptionId`/`payoutId` в URL параметрах — сверяется ли владение?
- [ ] **Claude:** Админ-эндпоинты (`/api/admin/**`) — двойная проверка `role==='admin'` на сервере (не доверять middleware)
- [ ] **Claude:** seller-эндпоинты — нельзя менять `sellerId` в body (mass-assignment)

### 1.5 Input validation и DoS (→ смешанно)

- [ ] **Codex:** пройтись по всем API-роутам и добавить Zod-схемы там где их нет (grep на `await req.json()` без Zod)
- [ ] **Claude:** size-limit на JSON body (`1MB`) — Next config или middleware
- [ ] **Codex:** валидация длин строк (name ≤ 200, description ≤ 5000, bio ≤ 1000)
- [ ] **Claude:** регулярные выражения — проверить на ReDoS (катастрофический backtracking)
- [ ] **Claude:** SSRF — если где-то фетчим user-provided URL (webhooks, avatar_url, photo_url от telegram): валидация хоста, запрет private ranges

### 1.6 Docker / изоляция агентов (→ Claude-heavy)

- [ ] **Claude:** аудит `src/lib/docker.ts`:
  - `--user` non-root внутри контейнера
  - `--cap-drop=ALL`, `--security-opt=no-new-privileges`
  - `--read-only` rootfs + tmpfs на `/tmp`
  - network mode: bridge (не host), только out-bound к конкретным AI API
  - `--pids-limit`, `--memory-swap`, `--cpus` (S/M/L)
  - no `--privileged`, no docker socket mount
- [ ] **Claude:** volume `/data` для M/L — namespace по `subscriptionId`, нельзя вылезти через `..`
- [ ] **Claude:** image scanning — `docker scout` или `trivy` на базовые образы agents-src/
- [ ] **Codex:** seccomp profile (дефолтный ок, но явно прописать)
- [ ] **Claude:** runtime prompt-injection защита: BYOK-ключи передаются через env — убедиться, что они не утекают в логи контейнера

### 1.7 Платежи (→ Claude)

- [ ] **Claude:** YooKassa webhook — IP allowlist уже есть, проверить CIDR актуальность по их доке
- [ ] **Claude:** Cryptomus webhook — HMAC-подпись в headers, проверить что используем её (не только whitelist)
- [ ] **Claude:** Idempotence-Key в YooKassa покрывает retry (уже есть `recurring:<sub>:<utc_day>`) — прогнать сценарий гонки
- [ ] **Claude:** amount/currency tampering — суммы считаются на сервере на основе `agents.price_monthly` (не из body)
- [ ] **Claude:** split math — проверить округление (floor vs round), не теряем ли копейки
- [ ] **Claude:** `payouts` table — race на статус (pending→sent→succeeded), должен быть DB-level lock или условный UPDATE

### 1.8 Шифрование и секреты (→ Claude)

- [ ] **Claude:** `ENCRYPTION_KEY` lifecycle: бэкап, план ротации, что будет если ключ утечёт (decrypt всех BYOK)
- [ ] **Claude:** `.env` на VPS — `chmod 600` (уже сделали), проверить что docker-compose не логирует значения
- [ ] **Codex:** `.env.example` с плейсхолдерами (без реальных ключей в гите)
- [ ] **Claude:** AES-GCM nonce uniqueness — проверить что nonce random per-encryption (не counter, не статичный)
- [ ] **Claude:** `BETTER_AUTH_SECRET` минимум 32 байта random — проверить текущую длину на VPS

### 1.9 Dependencies и supply-chain (→ Codex)

- [ ] **Codex:** `npm audit --production` — отчёт в PR, Claude решает что чинить
- [ ] **Codex:** Dependabot/Renovate (GitHub settings) — weekly schedule
- [ ] **Claude:** lockfile audit — pinned versions, нет unreviewed git-deps

### 1.10 Логи и observability (→ Claude)

- [ ] **Claude:** grep по логам: не логируем ли мы токены, BYOK-ключи, session-cookies, payment detail, PII
- [ ] **Claude:** agent_logs — убедиться что юзер видит только свои логи (IDOR check)
- [ ] **Codex:** log rotation для docker logs (`max-size`, `max-file` в docker-compose)
- [ ] **Claude:** health check endpoint — если есть, не раскрывает ли внутренности

### 1.11 Прочее

- [ ] **Codex:** `/.well-known/security.txt` (contact, preferred-languages)
- [ ] **Codex:** `/robots.txt` — разрешить каталог, запретить /admin, /api/, /seller/onboarding
- [ ] **Claude:** открытый редирект — проверить все `successUrl`/`returnUrl` — нельзя подсунуть внешний домен
- [ ] **Claude:** GDPR-minimum (для РФ — 152-ФЗ): privacy policy отражает что telegram_id хранится, account deletion endpoint

### 1.12 Финальный gate перед продом

- [ ] **Claude:** чек-лист OWASP Top 10 → A01 Broken Access Control, A02 Crypto, A03 Injection, A04 Insecure Design, A05 Misconfig, A07 Auth, A08 Data Integrity — по каждому пункту ответ «ок/не применимо/исправлено»
- [ ] **Claude:** попытка самопентеста: подменить `sellerId` в форме, передать отрицательную цену, покрутить webhook без подписи, вызвать cron без секрета, IDOR на `/api/agents/:id` через чужой id

---

## Приоритет 2 — Внешние блокеры (нужны от тебя)

- [ ] Google + GitHub OAuth credentials → `.env` на VPS
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

## Приоритет 4 — Starter Agents

Не критично для прода, делаем после security-gate.

- [ ] #2 Content Writer (~150 строк + ai_provider.py) — **Codex**
- [ ] #3 Competitor Monitor (~120 строк + ai_provider.py) — **Codex**
- [ ] #4 Website Monitor (changedetection.io wrapper) — **Codex**
- [ ] #5 News Digest Bot (telegram-news wrapper) — **Codex**

**Claude** ревьюит Dockerfile, entrypoint, ресурс-классы, BYOK-интерфейс.

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
