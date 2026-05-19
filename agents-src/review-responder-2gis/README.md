# Review Responder 2GIS

## Что это

Агент следит за новыми отзывами филиала в 2GIS, генерирует AI-черновик ответа в тоне бренда и присылает его владельцу в Telegram с кнопками `Отправить`, `Переписать`, `Пропустить`.

## Переменные окружения

| Переменная | Обязательно | Описание |
|---|---|---|
| `TWOGIS_BRANCH_ID` | да | Numeric branch id из URL 2GIS |
| `TELEGRAM_BOT_TOKEN` | да | Токен Telegram-бота |
| `OWNER_CHAT_ID` | да | Numeric chat id владельца |
| `BRAND_TONE` | да | Желаемый тон ответа |
| `CHECK_INTERVAL_MINUTES` | нет | По умолчанию `120`, минимум `30` |
| `TWOGIS_PUBLIC_KEY` | нет | Можно передать вручную, иначе агент попытается извлечь ключ с `https://2gis.ru/` |
| `AI_PROVIDER` | нет | `claude` (по умолчанию) или `openai` — выбирает дефолтную модель |
| `AI_MODEL` | нет | Переопределяет модель (полный путь OpenRouter, например `openai/gpt-5-mini`). Дефолт — `anthropic/claude-sonnet-4-6` |

AI-ключ юзер НЕ заполняет — платформа прокидывает свой managed OpenRouter-ключ как `OPENAI_API_KEY` через `src/lib/docker.ts`. И `claude`, и `openai` ходят через OpenRouter (OpenAI-compatible API).

## Как работает

- Бот опрашивает публичный reviews endpoint 2GIS по филиалу.
- На первом запуске все текущие отзывы помечаются как уже просмотренные, чтобы не завалить владельца историей.
- Для новых отзывов агент создаёт AI-черновик, сохраняет его в `/data/pending_reviews/` и отправляет сообщение с inline-кнопками.
- Кнопка `Переписать` генерирует альтернативную версию с более высокой вариативностью.

## Локальный тест

Для кастомных агентов build context должен быть корнем `agents-src/`, потому что `ai_provider.py` лежит уровнем выше каталога бота.

```bash
cd agents-src
docker build -f review-responder-2gis/Dockerfile -t review-responder-2gis .
cd review-responder-2gis
cp .env.example .env
# в .env вписать TWOGIS_BRANCH_ID, TELEGRAM_BOT_TOKEN, OWNER_CHAT_ID, BRAND_TONE
# OPENAI_API_KEY на локалке = твой OpenRouter ключ (или любой OpenAI-compatible)
docker compose up --build
```

## Лимиты

- `mem_limit: 1g`
- `cpus: 1.0`
- Состояние хранится в `review_responder_data`

## Known issues

- 2GIS не даёт публичный API для отправки ответа на отзыв. Кнопка `Отправить` сейчас только помечает черновик как одобренный и подсказывает скопировать текст вручную.
- Извлечение `TWOGIS_PUBLIC_KEY` с `https://2gis.ru/` хрупкое: 2GIS может поменять фронтенд и сломать regex-парсинг.
