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

mkdir -p /data/snapshots

exec "$@"
