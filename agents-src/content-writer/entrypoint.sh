#!/bin/sh
set -eu

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${CHANNEL_ID:?CHANNEL_ID is required}"
: "${TOPIC:?TOPIC is required}"
: "${TONE:?TONE is required}"
: "${POST_INTERVAL_HOURS:=24}"
: "${AI_PROVIDER:=claude}"
: "${CLAUDE_MODEL:=claude-haiku-4-5}"

case "$POST_INTERVAL_HOURS" in
  6|12|24|48) ;;
  *)
    echo "POST_INTERVAL_HOURS must be one of: 6, 12, 24, 48"
    exit 1
    ;;
esac

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
