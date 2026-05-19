# Content Writer

## Что это

Автопостер для Telegram-канала. Агент сам генерирует новые посты по заданной теме и в нужном тоне, а затем публикует их в канал по расписанию.

## Переменные окружения

| Переменная | Обязательно | Описание |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | да | Токен бота из @BotFather |
| `CHANNEL_ID` | да | Канал для публикации (`@name` или numeric `-100...`) |
| `TOPIC` | да | Тема канала, 1-2 предложения |
| `TONE` | да | Манера подачи, например `дружелюбно, с юмором` |
| `POST_INTERVAL_HOURS` | нет | Интервал публикаций: `6`, `12`, `24` или `48`. По умолчанию `24` |
| `AI_PROVIDER` | нет | `claude` (по умолчанию) или `openai` — выбирает дефолтную модель |
| `AI_MODEL` | нет | Переопределяет модель (полный путь OpenRouter, например `openai/gpt-5-mini`). Дефолт — `anthropic/claude-sonnet-4-6` |

AI-ключ юзер НЕ заполняет — платформа прокидывает свой managed OpenRouter-ключ как `OPENAI_API_KEY` через `src/lib/docker.ts`. И `claude`, и `openai` ходят через OpenRouter (OpenAI-compatible API).

## Как работает

- Состояние хранится в `/data/state.json`.
- После перезапуска агент читает `last_post_at` и не публикует повторный пост раньше положенного окна.
- При старте агент проверяет, просрочен ли интервал. Если да, публикует пост сразу.
- Если Telegram не принял сообщение, агент ждёт 30 секунд и делает ещё одну попытку.

## Локальный тест

Для кастомных агентов build context должен быть корнем `agents-src/`, потому что `ai_provider.py` лежит уровнем выше каталога бота.

```bash
cd agents-src
docker build -f content-writer/Dockerfile -t content-writer .
cd content-writer
cp .env.example .env
# в .env вписать TELEGRAM_BOT_TOKEN, CHANNEL_ID, TOPIC, TONE
# OPENAI_API_KEY на локалке = твой OpenRouter ключ (или любой OpenAI-compatible)
docker compose up --build
```

## Лимиты

- `mem_limit: 1g`
- `cpus: 1.0`
- Данные и расписание сохраняются в volume `content_writer_data`

## Known issues

- Агент не проверяет контент на редакционные риски и может требовать ручной вычитки.
- Если Telegram или AI-провайдер недоступны длительное время, публикация просто переносится на следующий цикл.
