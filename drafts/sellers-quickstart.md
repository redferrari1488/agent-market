# Hireon — Quickstart для продавцов

Маркетплейс AI-агентов. Покупатель платит подписку, твой контейнер деплоится
на нашем VPS, работает 24/7. Этот документ — что нужно собрать чтобы добавить
своего агента в каталог.

> Draft — кандидат на перенос в публичный `docs/sellers-quickstart.md` или
> `hireon.agency/docs/sellers` после ревью.

---

## Phase 0 — условия

- **0% комиссии.** Размещение бесплатное, ты получаешь 100% цены подписки.
- **Хостинг покрывает платформа.** VPS, ресурсы, мониторинг, Docker деплой —
  не твоя забота. Твой код просто работает в нашем контейнере.
- **Managed AI.** Если агент использует LLM — мы прокидываем платформенный
  ключ OpenRouter в твой контейнер. **Не просишь** API-ключи у покупателя
  и не подключаешь собственный аккаунт OpenAI/Anthropic.
- **Ручная модерация.** Каждый агент перед публикацией смотрит человек. Это
  чтобы каталог не превратился в зоопарк скам-ботов и сломанных скриптов.
- Когда платформа выйдет из Phase 0 — комиссия станет ненулевой, но **только
  для новых подписок**. Существующие сохранят 100% выплат.

## Что такое агент на Hireon

Это Docker-контейнер с одним длинноживущим процессом (обычно Python asyncio-
или schedule-loop). Контейнер деплоится при оплате, останавливается при
отмене подписки, перезапускается при сбоях. От тебя — Docker-образ + JSON-
схема того что должен заполнить покупатель.

Жизненный цикл:

```
покупка → setup wizard у покупателя → /api/checkout → webhook → деплой контейнера
              ↑                                                        ↓
              └──── собрано из твоего setup_schema                  твой main.py
                                                                       работает 24/7
```

## Структура файлов агента

```
agents-src/
  ai_provider.py          ← общий OpenRouter-клиент (не трогаешь, импортируешь)
  <твой-slug>/
    Dockerfile
    entrypoint.sh         ← валидация env + setup, заканчивается на `exec "$@"`
    main.py               ← основной цикл агента
    requirements.txt      ← Python deps
    docker-compose.yml    ← для локального dev (в проде НЕ используется)
```

Минимально: `Dockerfile` + `main.py` + `requirements.txt`. `entrypoint.sh`
нужен если есть валидация env или подготовка stuff перед запуском.

## Контракт setup_schema ↔ entrypoint ↔ main.py

Самый частый источник багов — несогласованные имена env vars между тем что
заполняет покупатель и тем что код реально читает. Контейнер тогда стартует
с пустым env и падает в restart loop.

**Правило:** имена ключей в `setup_schema` (JSONB поле в БД) РОВНО те же что
читает `entrypoint.sh` (через `: "${VAR:?...}"`) и `main.py` (через
`os.environ["VAR"]`). Соглашение — `UPPERCASE_SNAKE_CASE`.

Пример `setup_schema`:

```json
[
  {
    "key": "TELEGRAM_BOT_TOKEN",
    "type": "password",
    "label": "Telegram Bot Token",
    "required": true
  },
  {
    "key": "CHANNEL_ID",
    "type": "text",
    "label": "ID или @username канала",
    "required": true
  },
  {
    "key": "RSS_FEEDS",
    "type": "json_array",
    "label": "RSS-ленты JSON-массивом",
    "required": true
  },
  {
    "key": "FETCH_INTERVAL_MINUTES",
    "type": "select",
    "label": "Интервал опроса, минут",
    "options": ["15", "30", "60", "120", "360", "1440"],
    "required": false
  }
]
```

Типы полей:

| `type` | Назначение | Валидация |
|---|---|---|
| `text` | Однострочный текст | Не пустая строка если required |
| `textarea` | Многострочный текст | То же |
| `password` | Секрет (маска в UI, шифруется AES-256-GCM) | То же |
| `select` | Один из `options` | Значение в массиве `options` |
| `json_array` | JSON-массив строк | Парсится как `[..., ...]`, не пустой |

Платформа валидирует config по `setup_schema` ДО деплоя контейнера. Если
required-поле пустое — контейнер не запустится, покупатель увидит ошибку
в Setup Wizard.

## Hello World — агент за 30 минут

Покажу на минимальном примере (это реальный `echo-agent` из репо).

**`agents-src/echo-agent/main.py`:**

```python
import time
import traceback
from ai_provider import generate, get_provider_name

def main() -> None:
    print(f"[echo-agent] старт, провайдер {get_provider_name()}", flush=True)

    try:
        answer = generate(
            prompt="Поприветствуй покупателя одним коротким предложением.",
            system="Ты тестовый агент маркетплейса. Отвечай по-русски.",
            max_tokens=80,
            temperature=0.4,
        )
        print(f"[echo-agent] AI: {answer}", flush=True)
    except Exception as err:
        print(f"[echo-agent] AI упал: {err}", flush=True)
        traceback.print_exc()

    while True:
        time.sleep(3600)

if __name__ == "__main__":
    main()
```

**`agents-src/echo-agent/requirements.txt`:**

```
openai
```

**`agents-src/echo-agent/Dockerfile`:**

```dockerfile
FROM python:3.12-slim

RUN useradd -u 1000 -m runner
WORKDIR /app

COPY echo-agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_provider.py .
COPY echo-agent/main.py .

USER 1000:1000
ENV PYTHONUNBUFFERED=1

CMD ["python", "main.py"]
```

**`setup_schema`:** пустой массив (агент не требует config от покупателя).

Этот агент делает один AI-запрос на старте и спит. Реальные агенты добавляют
к этому: чтение env-переменных, asyncio/schedule-loop, отправку сообщений
куда-то (Telegram Bot API, webhook, файл в volume `/data`).

## AI через managed OpenRouter

В контейнер платформа прокидывает:

```
OPENAI_API_KEY=<наш OpenRouter ключ>
OPENAI_BASE_URL=https://openrouter.ai/api/v1
AI_PROVIDER=claude|openai   ← опционально, дефолт claude
AI_MODEL=<full OpenRouter path>  ← опционально, override
```

`ai_provider.py` уже всё это знает. Использование:

```python
from ai_provider import generate, get_provider_name

answer = generate(
    prompt="...",
    system="...",
    max_tokens=512,
    temperature=0.7,
)
```

Дефолтные модели:
- `claude` → `anthropic/claude-sonnet-4-6`
- `openai` → `openai/gpt-5-mini`

**Не запрашивай у покупателя AI-ключи.** Это нарушит UX и приведёт к
дополнительным платежам помимо подписки.

Если нужна не дефолтная модель — клади её в `env_template` как `AI_MODEL`,
например `anthropic/claude-haiku-4-5` для лёгкого контента.

## Build context = `agents-src/`

Важный нюанс. Платформа билдит все агенты единой командой:

```bash
docker build -t agent-market/<slug>:latest \
  -f agents-src/<slug>/Dockerfile \
  agents-src/
```

Контекст сборки — **`agents-src/`**, не `agents-src/<slug>/`. Это нужно
чтобы общий `ai_provider.py` (живёт в `agents-src/`) попал в build context.

В Dockerfile все `COPY` идут **с префиксом slug**:

```dockerfile
COPY <slug>/requirements.txt ./requirements.txt
COPY ai_provider.py ./ai_provider.py
COPY <slug>/main.py ./main.py
COPY <slug>/entrypoint.sh ./entrypoint.sh
```

Без префикса (`COPY entrypoint.sh ...`) сборка упадёт с
`entrypoint.sh: not found`.

## Compute classes

Покупатель не выбирает класс — его выбираешь ты при подаче агента, исходя
из реальных требований:

| Класс | CPU | RAM | Disk | Описание |
|---|---|---|---|---|
| **S** | 0.25 | 256 MB | 0 | Чат-боты, уведомления, лёгкие задачи |
| **M** | 0.5 | 512 MB | 1 GB | Контент, аналитика, мониторинг (есть state в `/data`) |
| **L** | 1.0 | 1 GB | 5 GB | Тяжёлые задачи, расписание, много данных |

Если агенту нужно сохранять state (seen RSS IDs, last_post_at, кэш и т.п.)
— выбирай минимум `M` и пиши в `/data`. В классе `S` диска нет, рестарт
обнуляет state.

## Локальное тестирование

В каталоге каждого агента кладёшь `docker-compose.yml` для собственного dev.
В проде он не используется, но удобен для отладки.

```yaml
# agents-src/<slug>/docker-compose.yml
services:
  bot:
    build:
      context: ..              # parent agents-src/
      dockerfile: <slug>/Dockerfile
    restart: unless-stopped
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      CHANNEL_ID: ${CHANNEL_ID}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_BASE_URL: https://openrouter.ai/api/v1
    volumes:
      - bot_data:/data

volumes:
  bot_data:
```

Запуск:

```bash
cd agents-src/<slug>/
cp .env.example .env  # или просто экспортни переменные
docker compose up --build
```

Должен увидеть логи запуска, AI-запрос, отправку в Telegram. Если есть
restart loop — смотри логи `entrypoint.sh`, обычно дело в имени env var.

## env_template — статичные переменные

Кроме `setup_schema` (что вводит покупатель), есть `env_template` —
fixed values от тебя как от продавца. Туда кладут дефолты, ссылки на
сервисы, версии моделей.

Пример для `content-writer`:

```json
{
  "AI_MODEL": "anthropic/claude-haiku-4-5",
  "AI_PROVIDER": "claude",
  "POST_INTERVAL_HOURS": "24"
}
```

`POST_INTERVAL_HOURS=24` тут дефолт — если покупатель не выберет в Setup
Wizard, контейнер запустится с этим значением. В `setup_schema` для этого
поля стоит `required: false`.

## Чего НЕ делать

- **Не просить API-ключи у покупателя.** Никаких `OPENAI_API_KEY`,
  `ANTHROPIC_API_KEY`, `STRIPE_KEY` в setup_schema. AI — managed,
  платёжки — через Hireon.
- **Не биндить порты на хост.** Контейнеры outbound-только (Telegram API,
  webhooks, OpenRouter). Если нужен inbound — пиши в обсуждение, добавим
  reverse-proxy.
- **Не писать в rootfs.** `/data` — единственное место для state.
  Контейнер запускается с readonly rootfs + tmpfs `/tmp`.
- **Не использовать `latest`-теги base images.** Зафиксируй версию
  (`python:3.12-slim`) — иначе сборка через год может сломаться.
- **Не клонить чужой репо без лицензии.** Если оборачиваешь open-source
  проект — проверь MIT/Apache/BSD и оставь attribution.

## Что попадает в env контейнера

Платформа собирает env из 3 источников и мержит в таком порядке:

1. `env_template` (твои дефолты)
2. `subscription.config` (что заполнил покупатель, расшифровано из AES-GCM)
3. Managed: `OPENAI_API_KEY` + `OPENAI_BASE_URL` (последним — не перетрётся)

Если хочешь чтобы значение из `env_template` всегда побеждало пользовательский
ввод — сделай поле `readonly` в setup_schema (не реализовано пока, обходишь
через отсутствие поля в схеме).

## Как податься

1. Собери код агента локально, проверь через `docker compose up`.
2. Заполни форму на `hireon.agency/seller/onboarding` (или напрямую
   через анкету сборки): описание агента, что делает, какие ENV нужны,
   compute class.
3. Загружаешь zip с `<slug>/Dockerfile` + `entrypoint.sh` + `main.py` +
   `requirements.txt`. `ai_provider.py` копировать не нужно — он общий.
4. Указываешь `setup_schema` (JSON) — обычно генерится из твоей анкеты.
5. Жди модерации — обычно 1-3 дня. Если нужно поправить — приходит
   ответ через ту же форму.
6. После approve — агент в каталоге, можно тестово купить с твоей карты
   и проверить полный flow.

## FAQ

**Можно использовать языки кроме Python?**
Да — Node.js, Go, Rust. Главное чтобы был Dockerfile и контейнер
правильно реагировал на SIGTERM (для graceful shutdown). `ai_provider.py`
тогда не используешь — пиши свой клиент к OpenRouter напрямую.

**Можно ли подключить базу данных?**
Внутри контейнера — нет (нет inbound портов). Если нужна персистентность —
используй `/data` volume и SQLite/файл. Если нужна shared между запусками
БД — пиши в обсуждение, добавим Postgres как managed-сервис.

**Сколько может стоить подписка?**
От 100₽/мес, без верхней границы. Реально продаваться будет 300-2000₽/мес.
Цены ниже 100₽ NowPayments отклонит (минимум крипто-сети).

**А если агент сломается у покупателя?**
Платформа мониторит restart-loop, после 3 рестартов помечает подписку
`error` и пишет тебе нотификацию. Покупатель видит «требует внимания
продавца» в дашборде.

---

**Связанные файлы в репо:**
- `agents-src/echo-agent/` — минимальный пример
- `agents-src/news-digest-bot/` — реальный production-агент с state
- `agents-src/ai_provider.py` — общий OpenRouter клиент
- `instructions/agents-build.md` — внутренний reference платформы
