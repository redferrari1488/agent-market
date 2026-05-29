#!/bin/sh
set -eu

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${CHANNEL_ID:?CHANNEL_ID is required}"
: "${OWNER_CHAT_ID:?OWNER_CHAT_ID is required}"
: "${TOPIC:?TOPIC is required}"
: "${TONE:?TONE is required}"
: "${POST_INTERVAL_HOURS:=24}"
: "${AI_PROVIDER:=claude}"

if ! printf '%s' "$OWNER_CHAT_ID" | grep -Eq '^-?[0-9]+$'; then
  echo "OWNER_CHAT_ID must be numeric"
  exit 1
fi

case "$POST_INTERVAL_HOURS" in
  6|12|24|48) ;;
  *)
    echo "POST_INTERVAL_HOURS must be one of: 6, 12, 24, 48"
    exit 1
    ;;
esac

# Managed AI через OpenRouter: оба AI_PROVIDER (claude|openai) реально
# вызывают OpenRouter через OpenAI SDK (см. ai_provider.py).
case "$AI_PROVIDER" in
  claude|openai)
    : "${OPENAI_API_KEY:?OPENAI_API_KEY is required (managed via OpenRouter)}"
    ;;
  *)
    echo "AI_PROVIDER must be either claude or openai"
    exit 1
    ;;
esac

# CONTENT_PILLARS / EXAMPLES / AUDIENCE / FORMAT_RULES / AVOID — опциональны,
# читаются из окружения в main.py с дефолтом "".

mkdir -p /data/pending_posts

exec "$@"
