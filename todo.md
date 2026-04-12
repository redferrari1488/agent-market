# TODO

## Phase B — External Blockers (require user action)

- [ ] Buy domain
- [ ] SSL (Let's Encrypt + Nginx)
- [ ] Google + GitHub OAuth credentials -> .env on VPS
- [ ] Telegram Login Widget: /setdomain at @BotFather for @agentmarket0_bot
- [ ] Email verification via Resend SMTP
- [ ] YooKassa Marketplace - submit application

## Phase C — Payment System Completion

Provider code already written (commit 3534c11), needs finishing:

- [ ] ProviderPicker UI component (YooKassa vs Cryptomus choice at checkout)
- [ ] Frontend starts passing `provider` to POST /api/checkout
- [ ] `/api/seller/onboarding` - form + POST /v3/me to YooKassa
- [ ] Cron for recurring YooKassa charges
- [ ] IP allowlist for YooKassa webhook
- [ ] Retry logic for failed Cryptomus payouts
- [ ] Activation = add ENV vars to .env on VPS, dev-stub auto-switches

## Phase D — Starter Agents (agents-src/)

- [x] #1 AI Support Bot - scaffold ready and working on VPS
- [ ] #2 Content Writer (~150 lines + ai_provider.py)
- [ ] #3 Competitor Monitor (~120 lines + ai_provider.py)
- [ ] #4 Website Monitor (changedetection.io wrapper)
- [ ] #5 News Digest Bot (telegram-news wrapper)
- [ ] #6 Review Responder 2GIS

## Blockers

- Domain not purchased -> no SSL, Telegram Login, email verification
- Google/GitHub OAuth credentials not configured (UI buttons exist but don't work)
- YooKassa application not submitted
- Email verification disabled

## Completed

- [x] Days 1-4: landing, catalog, agent detail, dashboard, Setup Wizard, encryption, email OTP, reviews
- [x] Day 5: Docker agent management (dockerode, API routes, LogViewer)
- [x] Day 7: Seller panel, AgentForm, SetupSchemaBuilder
- [x] Day 8: Admin panel, moderation, platform stats
- [x] Day 9: SEO metadata, error/loading/not-found states
- [x] Phase A redesign: product-led landing, editorial typography, 21 files cleaned from AI-slop
- [x] Phase C skeleton: YooKassa + Cryptomus provider code (createCheckout, webhooks, payouts)
- [x] Migration: Supabase removed, Drizzle + BetterAuth
- [x] agents-src/ai_provider.py - universal Claude/OpenAI switcher
