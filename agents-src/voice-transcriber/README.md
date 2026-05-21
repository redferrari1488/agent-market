# voice-transcriber

Telegram-бот, превращающий голосовые сообщения в текст через локальную Whisper-модель (multilingual base, CPU-only). Upstream: [Malith-Rukshan/whisper-transcriber-bot](https://github.com/Malith-Rukshan/whisper-transcriber-bot), MIT.

## ENV-переменные

| Переменная | Required | Default | Описание |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✓ | — | Токен от @BotFather |
| `WHISPER_MODEL_NAME` | | `base` | `base` (~142MB, multilingual). `small`/`medium` пока не bake-нуты в image |
| `MAX_AUDIO_SIZE_MB` | | `25` | Лимит размера audio. Telegram Bot API даёт скачивать до 20MB через getFile |
| `LOG_LEVEL` | | `INFO` | `INFO` / `DEBUG` / `WARNING` |

## Use case

Эксперт ведёт Telegram-канал — подписчики шлют голосовые в личку. Бот превращает их в текст, эксперт читает за 5 секунд вместо 5 минут прослушивания.

## Архитектура

- Multilingual `ggml-base.bin` модель bake-нута в Docker image (~142MB)
- ffmpeg для конверсии `.ogg` (TG voice) в `.wav`
- pywhispercpp — C++ bindings к whisper.cpp, в 2-3× быстрее чем openai-whisper на CPU
- Полностью локальная транскрипция, никаких внешних API

## Build

```bash
docker build -t agent-market/voice-transcriber:latest \
  -f agents-src/voice-transcriber/Dockerfile agents-src/
```

## Smoke test

```bash
docker run --rm \
  -e TELEGRAM_BOT_TOKEN='your_token' \
  -e WHISPER_MODEL_NAME=base \
  agent-market/voice-transcriber:latest
```

После запуска отправь боту голосовое сообщение в Telegram — должен ответить транскрипцией.

## Связано

[[handoff-pre-launch]], [[dockerfile-build-context]], [[managed-keys-post-phase0]] (если в будущем заменим на cloud-Whisper).
