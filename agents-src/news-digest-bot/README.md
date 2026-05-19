# News Digest Bot

## Что это

Агент следит за RSS-лентами, переписывает новые новости в заданном тоне через AI и публикует готовые короткие посты в Telegram-канал.

## Переменные окружения

| Переменная | Обязательно | Описание |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | да | Токен Telegram-бота |
| `CHANNEL_ID` | да | Канал для публикации |
| `RSS_FEEDS` | да | JSON-массив RSS URL-ов, максимум 10 |
| `TONE` | да | Желаемый тон публикаций |
| `FETCH_INTERVAL_MINUTES` | нет | По умолчанию `60`, минимум `15`, максимум `1440` |
| `MAX_POSTS_PER_CYCLE` | нет | По умолчанию `5`, чтобы не заливать канал после простоя |
| `AI_PROVIDER` | нет | `claude` (по умолчанию) или `openai` — выбирает дефолтную модель |
| `AI_MODEL` | нет | Переопределяет модель (полный путь OpenRouter, например `openai/gpt-5-mini`). Дефолт — `anthropic/claude-sonnet-4-6` |

AI-ключ юзер НЕ заполняет — платформа прокидывает свой managed OpenRouter-ключ как `OPENAI_API_KEY` через `src/lib/docker.ts`. И `claude`, и `openai` ходят через OpenRouter (OpenAI-compatible API).

## Как работает

- Состояние хранится в `/data/state.json`.
- На первом запуске агент помечает текущие новости как уже просмотренные и отправляет только одно сообщение об активации.
- На следующих циклах бот берёт только новые элементы, сортирует их по дате и публикует не больше `MAX_POSTS_PER_CYCLE`.
- После каждого успешного поста состояние сохраняется сразу, чтобы переживать перезапуски без дублей.

## Локальный тест

Для кастомных агентов build context должен быть корнем `agents-src/`, потому что `ai_provider.py` лежит уровнем выше каталога бота.

```bash
cd agents-src
docker build -f news-digest-bot/Dockerfile -t news-digest-bot .
cd news-digest-bot
cp .env.example .env
# в .env вписать TELEGRAM_BOT_TOKEN, CHANNEL_ID, RSS_FEEDS, TONE
# OPENAI_API_KEY на локалке = твой OpenRouter ключ (или любой OpenAI-compatible)
docker compose up --build
```

## Лимиты

- `mem_limit: 1g`
- `cpus: 1.0`
- Данные сохраняются в volume `news_digest_data`

## Known issues

- Если RSS-лента не отдаёт `id`, агент использует `link` как fallback, поэтому публикация зависит от стабильности URL.
- AI-переписывание не проверяет фактуру новости и не заменяет редактора.
