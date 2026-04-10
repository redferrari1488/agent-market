# AI Support Bot

Обёртка над [father-bot/chatgpt_telegram_bot](https://github.com/father-bot/chatgpt_telegram_bot) (MIT) для маркетплейса AI-агентов.

## Что это

Telegram-бот поддержки на базе GPT. Юзер отправляет сообщение — бот отвечает через OpenAI с учётом заданного system prompt.

## Архитектура обёртки

- Upstream `father-bot` **клонируется во время `docker build`** (не форкается). Это значит, что мы всегда получаем свежую версию, но и что breaking changes в upstream могут сломать сборку. Пиним версию через `ARG FATHER_BOT_REF=main` → при проде заменить на конкретный коммит.
- Конфиги (`config.yml`, `chat_modes.yml`, `models.yml`) генерирует `entrypoint.sh` на старте из env-переменных.
- MongoDB — отдельный сервис в `docker-compose.yml` (father-bot требует Mongo для истории диалогов).

## Env vars (из Setup Wizard)

| Переменная | Обязательно | Описание |
|-----------|------------|----------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Токен бота из @BotFather |
| `OPENAI_API_KEY` | ✅ | API-ключ OpenAI (BYOK) |
| `SYSTEM_PROMPT` | ✅ | Инструкция боту (тон, роль, FAQ) |
| `ALLOWED_TELEGRAM_USERNAMES` | — | JSON-массив username'ов (например `["@user1","@user2"]`), `[]` = все |

## Локальный тест

```bash
cd agents-src/ai-support-bot
cp .env.example .env
# отредактировать .env — вписать TELEGRAM_BOT_TOKEN и OPENAI_API_KEY
docker compose up --build
```

Открыть Telegram, написать боту `/start`, отправить тестовое сообщение.

## Лимиты ресурсов

- `bot`: 256MB RAM, 0.5 CPU
- `mongo`: 256MB RAM, 0.25 CPU

Итого: ~512MB RAM на одну подписку.

## Известные ограничения

- **OpenAI only.** Upstream `father-bot` зашит на OpenAI, переключатель Claude/OpenAI (`ai_provider.py`) здесь НЕ работает. Для Claude — либо форкать, либо ждать пока upstream добавит Anthropic, либо оборачивать Content Writer/Competitor Monitor (они изначально через `ai_provider.py`).
- **FAQ не передаётся как отдельный файл** — только через `SYSTEM_PROMPT`. Если FAQ большой, конкатенировать в промпт на стороне маркетплейса перед деплоем.
