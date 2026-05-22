#!/bin/bash
set -e

# Voice-transcriber: проверка required env + дефолты + exec.
# Платформа инжектит:
#   TELEGRAM_BOT_TOKEN — токен от @BotFather (юзер вводит в setup wizard)
# Опционально:
#   WHISPER_MODEL_NAME — base / small / medium (по умолчанию small, multilingual).
#                        В image bake'ится только указанный по умолчанию.
#   WHISPER_LANGUAGE — ISO-код языка для распознавания: ru (default), en, es и т.д.
#                       Явно фиксируем язык под наш рынок (RU) — small лучше base,
#                       но всё равно auto-detect может ошибаться на коротких клипах.
#   MAX_AUDIO_SIZE_MB — лимит размера аудио (по умолчанию 25 — соответствует
#                       стандартному лимиту Telegram Bot API на скачивание)
#   LOG_LEVEL — INFO/DEBUG/WARNING

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${WHISPER_MODEL_NAME:=small}"
: "${WHISPER_LANGUAGE:=ru}"
: "${MAX_AUDIO_SIZE_MB:=25}"
: "${LOG_LEVEL:=INFO}"
export WHISPER_MODEL_NAME WHISPER_LANGUAGE MAX_AUDIO_SIZE_MB LOG_LEVEL

# Путь к модели — upstream-код читает WHISPER_MODEL_PATH.
# Мы скачали ggml-small.bin (multilingual). Если кто-то решит сменить
# WHISPER_MODEL_NAME на base/medium — нужно либо скачивать модель в runtime,
# либо bake в image на этапе build. Пока поддерживаем только small из image.
export WHISPER_MODEL_PATH="/app/models/ggml-${WHISPER_MODEL_NAME}.bin"

if [ ! -f "$WHISPER_MODEL_PATH" ]; then
  echo "WARN: модель $WHISPER_MODEL_PATH не найдена в image, fallback на small" >&2
  export WHISPER_MODEL_PATH="/app/models/ggml-small.bin"
  export WHISPER_MODEL_NAME="small"
fi

exec "$@"
