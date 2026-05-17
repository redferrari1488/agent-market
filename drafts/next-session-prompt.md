# Промт для следующей сессии

## Контекст

Сегодня (2026-05-17 вечер) закрыли крипто-миграцию Cryptomus → NowPayments
полностью в проде, переработали страницу подписки `/dashboard/agents/[id]`
по новому дизайн-языку, нашли и пофиксили целый класс багов в агентах
(setup_schema / entrypoint / main.py имена env vars не совпадали — контейнер
не запускался даже с правильным конфигом). Добавили серверную валидацию
config во всех путях запуска контейнера. 7 коммитов в проде.

Подробности в memory `project_handoff_pre_launch.md`.

## Приоритет на следующую сессию

Двигаемся в порядке: **#1 → #3 → #2 → #4** (#5 ЮКасса blocked, #6 лонч в самом конце).

### #1 — Output preview на дашборде подписки (medium, 1-2 сессии)

**Контекст:** Все агенты шлют результат в Telegram (`CHANNEL_ID` / `CHAT_ID` /
`OWNER_CHAT_ID`). После редизайна дашборда у юзера крупный status panel
"Работает", но непонятно ГДЕ смотреть результат — на каком канале / чате.

**Что нужно:**
- В Status Panel `src/app/dashboard/agents/[id]/ManageView.tsx` добавить
  блок «Куда поступают результаты»: ссылка на `https://t.me/<channel_or_username>`,
  опционально preview последнего поста через Telegram Bot API
  `getChat` + `getChatHistory` (если bot имеет доступ к каналу).
- Backend endpoint `/api/subscriptions/[id]/output-info` который читает
  расшифрованный config, определяет канал (по конвенции `CHANNEL_ID` для
  публикаций, `CHAT_ID` / `OWNER_CHAT_ID` для уведомлений), и возвращает
  meta: URL, последний message timestamp, последний text preview.
- Чёткое отличие "канал публикаций" vs "чат уведомлений" в UI.

**Ограничение:** Telegram bot API limit — bot должен быть в канале как
админ чтобы getChat работал. Если нет доступа — fallback на показ id с
кнопкой "Открыть в Telegram" (`https://t.me/c/<id>` для приватных).

### #3 — Smoke-test скрипт агентов (large, КРИТИЧНО перед лончем)

**Контекст:** Сегодня нашли что `ANTHROPIC_API_KEY` check в entrypoint
ВСЕХ 4-х агентов был сломан с момента ввода managed AI через OpenRouter.
Никто не замечал пока юзер не кликнул реально. Аналогично у 3-х агентов
имена env vars в setup_schema не совпадали с entrypoint. Это классические
проблемы которые ловятся smoke-deploy.

**Что нужно:**
- `scripts/smoke-agents.ts` (или `.mjs`) — для каждого published агента:
  1. Deploy контейнер с заглушечным config (минимальный валидный набор)
     в test-namespace (`smoke-<slug>-<timestamp>`)
  2. Подождать 30 секунд
  3. Проверить `docker inspect` — status `running`, не в restart loop
     (RestartCount < 3), нет fatal в логах
  4. Удалить контейнер
- `npm run smoke:agents` в `package.json`
- В идеале — pre-commit hook или CI step. Минимум — runbook в
  `instructions/agents-build.md`.
- Заглушечные config для каждого агента (mock telegram tokens, mock URLs).
  Хранить в `scripts/smoke-fixtures/<slug>.json`.

**Сложность:** требует Docker access — на VPS, не локально (если на маке
нет Docker daemon). Возможно через ssh + docker. Или через тот же
`dockerode` который используется в `src/lib/docker.ts`.

### #2 — NowPayments UX: минимумы и cooldown (small, 0.5 сессии)

**Контекст:** Сейчас при <$2 или в 2-часовом cooldown NowPayments возвращает
"Currently unavailable. Try in 2 hours" — юзер видит это в их инвойсе после
checkout, без понимания что делать. Минимумы зависят от выбранной крипто-сети
(USDT-TRX ~$2, USDC-SOL ~$1, BTC ~$10+).

**Что нужно:**
- На странице агента `src/app/agents/[slug]/page.tsx`: под кнопкой
  "Криптовалюта" в ProviderPicker подсказка с минимумом ($1-2 эквивалент)
  и текущим примерным курсом.
- При `price_monthly` < минимум — disable "Криптовалюта" с тултипом
  "Сумма ниже минимума крипто-сети. Используй ЮКассу."
- В `src/lib/payments/nowpayments.ts.createCheckout` — catch на known
  NowPayments errors:
  - "MIN_AMOUNT_ERROR" → дружелюбное сообщение
  - сетевая 5xx → "Платёжный шлюз временно недоступен"
- Минимумы можно захардкодить (USDT-TRX=$2, BTC=$10, SOL=$1) или
  динамически тянуть через `GET /v1/min-amount?currency_from=usdttrc20&currency_to=usdttrc20`.

### #4 — Документация для продавцов (medium, 1-2 сессии)

**Контекст:** `instructions/agents-build.md` сейчас написан для нас
(internal reference) — нужен публичный `docs/sellers-quickstart.md` или
сабдомен `docs.hireon.agency` для приёма сторонних продавцов когда лонч
запустит трафик. Без этого они упрутся в стену "как собрать setup_schema".

**Что нужно:**
- `docs/sellers-quickstart.md` (или Markdown в публичном репо). Структура:
  1. Что такое hireon Phase 0 (бесплатное размещение, 0% комиссия)
  2. Quickstart: «Hello World» агент за 30 минут
  3. Контракт: setup_schema ↔ entrypoint ↔ main.py
  4. Реальный пример с разбором (взять news-digest-bot)
  5. AI через managed OpenRouter (не BYOK)
  6. Локальное тестирование через docker-compose
  7. Как податься на review (форма seller_applications)
- Опционально: рендер на `hireon.agency/docs/sellers` через MDX
  в Next.js.
- Линки в footer / в onboarding flow продавца.

## Что НЕ делать в следующей сессии

- ЮКасса recurring — blocked, ждём ответ СБ. Когда придёт — отдельная итерация:
  активация ключей, удаление mock-подписки `6fb66bc6-ea84-4bd7-b127-e56a7f31ac72`,
  cron `/api/cron/yookassa-recurring`, e2e тест авто-списания.
- Лонч-пост — last priority.
- Trust Wallet → биржа payout автоматизация — Phase 1, не Phase 0.
- Удаление test-агента `test-nowpayments-smoke` из БД — оставить пока для
  smoke-теста крипты (когда cooldown пройдёт).

## Файлы которые я бы открыл первым делом следующей сессии

- `src/app/dashboard/agents/[id]/ManageView.tsx` — место для Output preview
- `src/lib/docker.ts` — для smoke-test reuse `deployContainer`/`removeContainer`
- `instructions/agents-build.md` — базис для sellers-quickstart
- `src/components/checkout/ProviderPicker.tsx` — место для cryptocurrency min hint
- `src/lib/payments/nowpayments.ts` — catch для cooldown errors
