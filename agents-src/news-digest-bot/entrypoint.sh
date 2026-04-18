#!/bin/sh
set -eu

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${CHANNEL_ID:?CHANNEL_ID is required}"
: "${RSS_FEEDS:?RSS_FEEDS is required}"
: "${TONE:?TONE is required}"
: "${FETCH_INTERVAL_MINUTES:=60}"
: "${MAX_POSTS_PER_CYCLE:=5}"
: "${AI_PROVIDER:=claude}"
: "${CLAUDE_MODEL:=claude-haiku-4-5}"

if ! printf '%s' "$FETCH_INTERVAL_MINUTES" | grep -Eq '^[0-9]+$'; then
  echo "FETCH_INTERVAL_MINUTES must be an integer"
  exit 1
fi

if [ "$FETCH_INTERVAL_MINUTES" -lt 15 ] || [ "$FETCH_INTERVAL_MINUTES" -gt 1440 ]; then
  echo "FETCH_INTERVAL_MINUTES must be between 15 and 1440"
  exit 1
fi

if ! printf '%s' "$MAX_POSTS_PER_CYCLE" | grep -Eq '^[0-9]+$'; then
  echo "MAX_POSTS_PER_CYCLE must be an integer"
  exit 1
fi

if [ "$MAX_POSTS_PER_CYCLE" -lt 1 ]; then
  echo "MAX_POSTS_PER_CYCLE must be at least 1"
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

mkdir -p /data

exec "$@"
