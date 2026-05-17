#!/bin/sh
set -eu

: "${TWOGIS_BRANCH_ID:?TWOGIS_BRANCH_ID is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${OWNER_CHAT_ID:?OWNER_CHAT_ID is required}"
: "${BRAND_TONE:?BRAND_TONE is required}"
: "${CHECK_INTERVAL_MINUTES:=120}"
: "${AI_PROVIDER:=claude}"

if ! printf '%s' "$TWOGIS_BRANCH_ID" | grep -Eq '^[0-9]+$'; then
  echo "TWOGIS_BRANCH_ID must be numeric"
  exit 1
fi

if ! printf '%s' "$OWNER_CHAT_ID" | grep -Eq '^-?[0-9]+$'; then
  echo "OWNER_CHAT_ID must be numeric"
  exit 1
fi

if ! printf '%s' "$CHECK_INTERVAL_MINUTES" | grep -Eq '^[0-9]+$'; then
  echo "CHECK_INTERVAL_MINUTES must be an integer"
  exit 1
fi

if [ "$CHECK_INTERVAL_MINUTES" -lt 30 ]; then
  echo "CHECK_INTERVAL_MINUTES must be at least 30"
  exit 1
fi

# Managed AI через OpenRouter: оба AI_PROVIDER (claude|openai) реально
# вызывают OpenRouter через OpenAI SDK (см. ai_provider.py).
# AI_PROVIDER управляет дефолтной моделью, ключ всегда OPENAI_API_KEY
# (прокидывается из платформенного OPENROUTER_API_KEY в src/lib/docker.ts).
case "$AI_PROVIDER" in
  claude|openai)
    : "${OPENAI_API_KEY:?OPENAI_API_KEY is required (managed via OpenRouter)}"
    ;;
  *)
    echo "AI_PROVIDER must be either claude or openai"
    exit 1
    ;;
esac

mkdir -p /data/pending_reviews

exec "$@"
