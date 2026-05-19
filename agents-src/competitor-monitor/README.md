# Competitor Monitor

## Что это

Агент ежедневно обходит сайты конкурентов, сохраняет текстовые снимки страниц, строит diff по изменениям и присылает в Telegram краткий AI-отчёт о том, что изменилось и что это значит для бизнеса.

## Переменные окружения

| Переменная | Обязательно | Описание |
|---|---|---|
| `COMPETITOR_URLS` | да | JSON-массив URL-ов, максимум 10 |
| `TELEGRAM_BOT_TOKEN` | да | Токен Telegram-бота |
| `CHAT_ID` | да | Numeric chat id владельца |
| `BUSINESS_DESC` | да | 1-2 предложения о бизнесе клиента |
| `CHECK_INTERVAL_HOURS` | нет | `12`, `24` или `48`. По умолчанию `24` |
| `AI_PROVIDER` | нет | `claude` (по умолчанию) или `openai` — выбирает дефолтную модель |
| `AI_MODEL` | нет | Переопределяет модель (полный путь OpenRouter, например `openai/gpt-5-mini`). Дефолт — `anthropic/claude-sonnet-4-6` |

AI-ключ юзер НЕ заполняет — платформа прокидывает свой managed OpenRouter-ключ как `OPENAI_API_KEY` через `src/lib/docker.ts`. И `claude`, и `openai` ходят через OpenRouter (OpenAI-compatible API).

## Как работает

- Текстовые снапшоты страниц сохраняются в `/data/snapshots/`.
- Состояние хранится в `/data/state.json`.
- На первом запуске агент только сохраняет базовую версию страниц и отправляет короткое сообщение о старте мониторинга.
- Если страница изменилась, агент сохраняет новый снапшот и добавляет truncated diff в общий AI-промпт.
- Если AI недоступен, снапшоты всё равно обновляются, чтобы мониторинг не останавливался.

## Локальный тест

Для кастомных агентов build context должен быть корнем `agents-src/`, потому что `ai_provider.py` лежит уровнем выше каталога бота.

```bash
cd agents-src
docker build -f competitor-monitor/Dockerfile -t competitor-monitor .
cd competitor-monitor
cp .env.example .env
# в .env вписать COMPETITOR_URLS, TELEGRAM_BOT_TOKEN, CHAT_ID, BUSINESS_DESC
# OPENAI_API_KEY на локалке = твой OpenRouter ключ (или любой OpenAI-compatible)
docker compose up --build
```

## Лимиты

- `mem_limit: 1g`
- `cpus: 1.0`
- Данные сохраняются в volume `competitor_monitor_data`

## Known issues

- Агент анализирует видимый текст страницы, а не полноценный DOM или JavaScript-состояние.
- Если сайт отдаёт разный контент на каждый запрос, diff может быть шумным.
