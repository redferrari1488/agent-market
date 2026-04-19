# TODO

## Phase B — External Blockers (require user action)

- [x] Buy domain (hireon.agency)
- [x] SSL (Let's Encrypt + Nginx)
- [x] Telegram Login Widget: /setdomain at @BotFather for @agentmarket0_bot
- [ ] Google + GitHub OAuth credentials -> .env on VPS
- [ ] Email verification via Resend SMTP
- [ ] YooKassa Marketplace - submit application

## Phase C — Payment System Completion

- [x] ProviderPicker UI component (src/components/checkout/ProviderPicker.tsx)
- [x] Frontend passes `provider` to POST /api/checkout (PurchaseButton.tsx:96)
- [x] `/api/seller/onboarding` — form + manual accountId + fallback `pending_review` + admin review flow
- [x] Cron for recurring YooKassa charges (cron route + systemd timer on VPS, window [-24h, +24h])
- [x] IP allowlist for YooKassa webhook (CIDR v4/v6)
- [x] Retry logic for failed Cryptomus payouts (cron route + systemd timer)
- [x] Activation via ENV vars on VPS (dev-stub auto-switches through `providerEnvConfigured`)

Still open:
- [ ] `yookassaProvider.createSellerAccount` — real `POST /v3/me` (currently throws, fallback to `pending_review` works, admin approves manually)
- [ ] Cryptomus `createCheckout` — currency hardcoded to `"RUB"` (src/lib/payments/cryptomus.ts:90); need model decision for USD agents
- [ ] `cryptmusWalletAddress` typo in schema.ts — JS-only (SQL column is correct); cosmetic rename across 8 files

## Phase C2 — Compute/Hardening

- [x] `subscriptions.seller_price` snapshot at checkout (checkout/route.ts:104) — protects against price-change race
- [x] UI warning when changing `compute_class` on agent with active subs (AgentForm.tsx:539-544)
- [x] Persistent storage for M/L classes via named volume `/data` (docker.ts:93-99)
- [x] Enforce `cronAllowed=false` for S/M (only L allows cron; seller/agents/route.ts:83-88 POST+PUT)
- [ ] Cryptomus payout currency: end-to-end from `event.currency` (webhook already uses it; retry route uses stored `payouts.currency` which is fine; main gap is createCheckout hardcode)

## Phase D — Starter Agents (agents-src/)

- [x] #1 AI Support Bot
- [x] #6 Review Responder 2GIS
- [ ] #2 Content Writer (~150 lines + ai_provider.py)
- [ ] #3 Competitor Monitor (~120 lines + ai_provider.py)
- [ ] #4 Website Monitor (changedetection.io wrapper)
- [ ] #5 News Digest Bot (telegram-news wrapper)

## Ops / Infra

- [x] CRON_SECRET gate on cron endpoints + systemd timers (hireon-yookassa-recurring, hireon-cryptomus-payout-retry)
- [x] systemd units hardened: `chmod 600 .env`, `ExecCondition` checks non-empty provider creds, loopback curl (127.0.0.1:3000), systemd-expanded `${CRON_SECRET}` (no `sh -lc`), response bodies logged to journal

## Blockers

- Google/GitHub OAuth credentials not in .env → OAuth buttons render but don't work
- YooKassa Marketplace application not submitted → subscriptions/checkout run in dev-stub mode (no real charges)
- Email verification disabled → no SMTP (Resend) configured

## Completed (recent history)

- Telegram Login widget активирован (2026-04-20): username=agentmarket0_bot, /setdomain=hireon.agency, токен в .env
- systemd cron timers + CRON_SECRET (2026-04-20, commits 324f882 + VPS unit fixes)
- Rebrand AgentMarket → Hireon (commit 63eb676)
- SSL/HTTPS hireon.agency (commit 52a2345)
- Phase C skeleton + wiring (ProviderPicker, onboarding flow, IP allowlist, cron timers)
- Phase A redesign, product-led landing, editorial typography
- Days 1-9: landing, catalog, agent detail, dashboard, Setup Wizard, encryption, email OTP, reviews, Docker mgmt, seller + admin panels, SEO metadata
- Self-hosted migration: Supabase removed, Drizzle + BetterAuth
- agents-src/ai_provider.py — universal Claude/OpenAI switcher
