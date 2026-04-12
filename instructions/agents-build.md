# Agent Building — Instruction Module

**READ THIS ENTIRE FILE before building or modifying AI agent Docker images.**

## Overview

Platform agents (seller_id = NULL) are admin-owned. All use shared `ai_provider.py` module: buyer chooses between Claude (default, recommended) and OpenAI. Model per agent selected individually (Haiku for volume, Sonnet for analytics).

## BYOK (Bring Your Own Key)

Buyer provides their own Anthropic/OpenAI API key in Setup Wizard. Platform charges only subscription fee, tokens paid directly to AI provider. This minimizes abuse risk.

## Agent Catalog

### 1. AI Support Bot — 1900 RUB/mo
Based on `father-bot/chatgpt_telegram_bot` (MIT). User provides: Telegram Bot Token, system prompt, FAQ (optional), AI API Key. Model: Haiku.

### 2. Content Writer — 1500 RUB/mo
Custom code (~150 lines). User provides: topic, tone, schedule, Telegram Bot Token, channel ID, AI API Key. Model: Haiku. Generates posts on schedule.

### 3. Competitor Monitor — 2500 RUB/mo or 9900 RUB one-time
Custom code (~120 lines). User provides: competitor URLs, Telegram Bot Token, Chat ID, business description, AI API Key. Model: Sonnet. Daily parsing + AI report.

### 4. Website Monitor — 2500 RUB/mo
Based on `changedetection.io` (Apache 2.0). No AI — general page change monitoring with web panel.

### 5. News Digest Bot — 1500 RUB/mo
Based on `ESWZY/telegram-news` (MIT) + AI wrapper. User provides: Telegram Bot Token, channel ID, RSS feeds, tone, AI API Key. Model: Haiku.

### 6. Review Responder (2GIS) — 2000 RUB/mo
Custom code. Monitors 2GIS reviews, generates AI response matching brand tone, sends to Telegram for approval. Model: Sonnet.

## Build Order

#1 -> #2 -> #3 -> #4 -> #5 -> #6

## File Structure

All Docker images in `/agents-src/<slug>/` in repo, built locally and pushed to registry for VPS deploy.

```
agents-src/
  ai_provider.py          — universal Claude/OpenAI switcher
  ai-support-bot/         — Agent #1
    Dockerfile
    entrypoint.sh
    docker-compose.yml
  content-writer/         — Agent #2
  competitor-monitor/     — Agent #3
  ...
```

### ai_provider.py

Universal module with `AI_PROVIDER=claude|openai` switch. Default: Claude. Model per agent in `env_template` (e.g., `CLAUDE_MODEL=claude-haiku-4-5`).

## Lessons

*Empty — will be filled as mistakes happen.*
