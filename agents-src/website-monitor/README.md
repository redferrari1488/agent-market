# Website Monitor

## Что это

Готовая обёртка над `changedetection.io`, которая следит за изменениями на сайтах и отправляет уведомления в Telegram через Apprise.

## Переменные окружения

| Переменная | Обязательно | Описание |
|---|---|---|
| `WATCH_URLS` | да | JSON-массив URL-ов для мониторинга, максимум 20 |
| `TELEGRAM_BOT_TOKEN` | да | Токен Telegram-бота для уведомлений |
| `CHAT_ID` | да | Numeric chat id получателя |
| `CHECK_INTERVAL_MINUTES` | нет | Интервал проверки в минутах. По умолчанию `360`, минимум `30` |
| `API_KEY` | нет | Можно передать вручную, иначе агент сгенерирует ключ сам и сохранит в `/data/api_key` |

## Как работает

- При старте контейнер запускает `changedetection.py` в фоне.
- Затем ждёт, пока поднимется REST API на `http://127.0.0.1:5000/api/v1/systeminfo`.
- Если `/data/.seeded` ещё нет, агент один раз добавляет все URL из `WATCH_URLS` через API и настраивает Telegram-уведомления.
- Для доступа к API используется `API_KEY`, который сохраняется в `/data/api_key`.

## Локальный тест

```bash
cd agents-src/website-monitor
cp .env.example .env
docker build -f Dockerfile -t website-monitor .
docker compose up --build
```

## Лимиты

- `mem_limit: 1g`
- `cpus: 1.0`
- Данные `changedetection.io` и ключ API хранятся в volume `website_monitor_data`

## Known limitations

- Внешний Web UI сейчас не публикуется маркетплейсом наружу. Пользователь получает изменения только через Telegram-уведомления.
- Схема первичного сидирования одноразовая: если поменяли `WATCH_URLS`, нужно удалить `/data/.seeded` или создать новый volume.
