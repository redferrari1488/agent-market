## Agent Building — Instruction Module

**READ THIS ENTIRE FILE before building or modifying AI agent Docker images.**

## Overview

Platform agents (`seller_id = NULL`) are admin-owned. AI вызовы — **managed via OpenRouter** (платформенный `OPENROUTER_API_KEY` прокидывается в контейнер как `OPENAI_API_KEY` + `OPENAI_BASE_URL=https://openrouter.ai/api/v1`). Юзер AI-ключ НЕ заполняет.

`ai_provider.py` (общий модуль) принимает `AI_PROVIDER=claude|openai` (управляет дефолтной моделью) и `AI_MODEL` (полный путь OpenRouter, override). Дефолты:
- `claude` → `anthropic/claude-sonnet-4-6`
- `openai` → `openai/gpt-5-mini`

## Контракт «setup_schema ↔ entrypoint ↔ main.py»

**Самый частый источник багов:** имена env vars не совпадают между тем что юзер заполняет (`agents.setup_schema`) и тем что код реально читает (`os.environ`). Контейнер запускается с пустым env, падает в restart loop.

**Правило для нового агента:**

1. Имена ключей в `setup_schema` = РОВНО те же, что читает `entrypoint.sh` и `main.py` (`os.environ["..."]`). По соглашению — UPPERCASE_SNAKE_CASE.
2. Каждое required-поле помечается `required: true` в `setup_schema`. Серверная валидация (`src/lib/agent-config-validation.ts`) автоматически блокирует deploy если поле пустое.
3. Для JSON-массивов используется `type: "json_array"` — это включает и фронт-, и бэк-валидацию (непустой массив строк).
4. Для фиксированных вариантов — `type: "select"` + `options: ["...", "..."]` — валидируется что значение в списке.
5. Если у поля есть дефолт (например `CHECK_INTERVAL_MINUTES`), кладём его в `env_template` и помечаем поле `required: false`.
6. **НЕ запрашивать у юзера** `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / любой AI-ключ. Платформа прокидывает свой через OpenRouter.

## Defence-in-depth слои валидации

При запуске контейнера три уровня проверок:
1. **Frontend SetupWizard** (`src/app/dashboard/agents/[id]/SetupWizard.tsx`) — мягкая валидация при вводе.
2. **API endpoints** (`/api/subscriptions/[id]/config|start|restart`) — серверная валидация против `setup_schema` через `validateSubscriptionConfig(id)`. Без этого контейнер НЕ деплоится.
3. **Container entrypoint.sh** — последний рубеж: `: "${VAR:?VAR is required}"` падает с понятным сообщением если env vars всё-таки не приехали (например, env_template сломан).

Все три слоя должны соглашаться по именам.

## Agent Catalog (актуальное состояние, 2026-05)

| Slug | Базис | Required env vars | Model |
|---|---|---|---|
| `telegram-support-bot` (ai-support-bot image) | father-bot/chatgpt_telegram_bot | `TELEGRAM_BOT_TOKEN`, `SYSTEM_PROMPT` | gpt-5-mini |
| `content-writer` | custom | `TELEGRAM_BOT_TOKEN`, `CHANNEL_ID`, `TOPIC`, `TONE`, `POST_INTERVAL_HOURS` | claude-haiku-4-5 |
| `competitor-monitor` | custom | `COMPETITOR_URLS`, `BUSINESS_DESC`, `TELEGRAM_BOT_TOKEN`, `CHAT_ID` | claude-sonnet-4-6 |
| `website-monitor` | changedetection.io | `WATCH_URLS`, `TELEGRAM_BOT_TOKEN`, `CHAT_ID` | — (no AI) |
| `news-digest-bot` | custom | `TELEGRAM_BOT_TOKEN`, `CHANNEL_ID`, `RSS_FEEDS`, `TONE` | claude-haiku-4-5 |
| `review-responder-2gis` | custom | `TWOGIS_BRANCH_ID`, `TELEGRAM_BOT_TOKEN`, `OWNER_CHAT_ID`, `BRAND_TONE` | claude-sonnet-4-6 |

## File Structure

```
agents-src/
  ai_provider.py          — universal OpenRouter client (Claude/OpenAI switcher)
  <slug>/
    Dockerfile
    entrypoint.sh         — env validation + setup; ends with `exec "$@"`
    main.py               — runs forever (asyncio loop)
    requirements.txt
    docker-compose.yml    — для локального dev (НЕ используется в проде)
```

## Build & Deploy

Образы строятся **локально на VPS** через `docker build -t agent-market/<slug>:latest -f agents-src/<slug>/Dockerfile agents-src/`. Не пушим в registry — VPS использует локальные образы (`docker.lookup` ищет `agent-market/<slug>:latest`).

**Контекст сборки — всегда `agents-src/`** (не `agents-src/<slug>/`). Все `COPY` в Dockerfile должны идти с префиксом `<slug>/` (например `COPY ai-support-bot/entrypoint.sh /entrypoint.sh`). Это нужно потому что общий модуль `ai_provider.py` живёт в `agents-src/` и должен быть доступен в build context. Единая команда для всех 6 агентов разблокирует будущий `npm run smoke:agents`.

После любого изменения в `agents-src/<slug>/` нужно ребилдить образ. Существующие контейнеры подхватят новый образ только при `docker rm -f <container>` + следующий `deployContainer` (restart недостаточно — `container.restart()` использует тот же image SHA).

## Lessons

- **2026-05-17:** entrypoint всех 4-х агентов требовал `ANTHROPIC_API_KEY` при `AI_PROVIDER=claude`, но платформа прокидывает только `OPENAI_API_KEY` (через OpenRouter). Контейнеры в restart loop. Fix: объединить ветки case в одну `claude|openai)` с проверкой `OPENAI_API_KEY`.
- **2026-05-17:** `setup_schema` 3-х агентов (`competitor-monitor`, `content-writer`, `ai-support-bot`) использовал lowercase ключи (`urls`, `topic`, `telegram_token`), а entrypoint/main.py читали UPPERCASE (`COMPETITOR_URLS`, `TOPIC`, `TELEGRAM_BOT_TOKEN`). Контейнеры запускались с пустым env. Fix: переименовать в DB и seeds; ввести правило «имена ключей строго совпадают».
- **2026-05-17:** Сервер деплоил контейнер сразу после сохранения config без проверки required-полей. Юзер мог пройти SetupWizard с пустым `RSS_FEEDS` → restart loop. Fix: `validateSubscriptionConfig(id)` в `/config`, `/start`, `/restart` — все пути блокируют deploy при неполном конфиге.
- **2026-05-17 (аудит вечером):** `ai-support-bot/Dockerfile` и `website-monitor/Dockerfile` использовали `COPY entrypoint.sh /entrypoint.sh` БЕЗ префикса `<slug>/`. Это работало раньше только потому что их кто-то билдил из каталога агента (`cd agents-src/ai-support-bot/ && docker build .`), а единая команда `docker build -f agents-src/<slug>/Dockerfile agents-src/` падала с `entrypoint.sh: not found`. Fix: добавить префикс во всех `COPY` (`COPY <slug>/entrypoint.sh ...`). Открылось когда `image prune -a` снёс все образы и пришлось пересобирать единой командой.
