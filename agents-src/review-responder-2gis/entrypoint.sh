#!/bin/sh
set -eu

: "${TWOGIS_BRANCH_ID:?TWOGIS_BRANCH_ID is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${OWNER_CHAT_ID:?OWNER_CHAT_ID is required}"
: "${BRAND_TONE:?BRAND_TONE is required}"
: "${CHECK_INTERVAL_MINUTES:=120}"
: "${AI_PROVIDER:=claude}"
: "${CLAUDE_MODEL:=claude-sonnet-4-6}"

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

case "$AI_PROVIDER" in
  claude)
    : "${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is required when AI_PROVIDER=claude}"
    ;;
  openai)
    : "${OPENAI_API_KEY:?OPENAI_API_KEY is required when AI_PROVIDER=openai}"
    ;;
  *)
    echo "AI_PROVIDER must be either claude or openai"
    exit 1
    ;;
esac

mkdir -p /data/pending_reviews

exec "$@"
