#!/bin/sh
set -eu

: "${COMPETITOR_URLS:?COMPETITOR_URLS is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${CHAT_ID:?CHAT_ID is required}"
: "${BUSINESS_DESC:?BUSINESS_DESC is required}"
: "${CHECK_INTERVAL_HOURS:=24}"
: "${AI_PROVIDER:=claude}"
: "${CLAUDE_MODEL:=claude-sonnet-4-6}"

case "$CHECK_INTERVAL_HOURS" in
  12|24|48) ;;
  *)
    echo "CHECK_INTERVAL_HOURS must be one of: 12, 24, 48"
    exit 1
    ;;
esac

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

mkdir -p /data/snapshots

exec "$@"
