#!/bin/bash
set -e

# Voice-transcriber: проверка required env + дефолты + exec.
# Платформа инжектит:
#   TELEGRAM_BOT_TOKEN — токен от @BotFather (юзер вводит в setup wizard)
# Опционально:
#   WHISPER_MODEL_NAME — base / small / medium (по умолчанию base, multilingual)
#   MAX_AUDIO_SIZE_MB — лимит размера аудио (по умолчанию 25 — соответствует
#                       стандартному лимиту Telegram Bot API на скачивание)
#   LOG_LEVEL — INFO/DEBUG/WARNING

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${WHISPER_MODEL_NAME:=base}"
: "${MAX_AUDIO_SIZE_MB:=25}"
: "${LOG_LEVEL:=INFO}"

# Путь к модели — upstream-код читает WHISPER_MODEL_PATH.
# Мы скачали ggml-base.bin (multilingual). Если кто-то решит сменить
# WHISPER_MODEL_NAME на small/medium — нужно либо скачивать модель в runtime,
# либо bake в image на этапе build. Пока поддерживаем только base из image.
export WHISPER_MODEL_PATH="/app/models/ggml-${WHISPER_MODEL_NAME}.bin"

if [ ! -f "$WHISPER_MODEL_PATH" ]; then
  echo "WARN: модель $WHISPER_MODEL_PATH не найдена в image, fallback на base" >&2
  export WHISPER_MODEL_PATH="/app/models/ggml-base.bin"
  export WHISPER_MODEL_NAME="base"
fi

exec "$@"
