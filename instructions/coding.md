# Coding — Instruction Module

**READ THIS ENTIRE FILE before starting any coding task.**

## Stack

- Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, framer-motion
- Backend: Next.js API Routes (Route Handlers)
- DB: PostgreSQL (Drizzle ORM, BetterAuth)
- Validation: Zod
- Icons: lucide-react
- Encryption: AES-256-GCM

## Core Principles

- **No Workarounds:** fix architecture, not symptoms
- **Simplicity First:** minimal code impact, no speculative abstractions
- **Plan First:** enter plan mode for any non-trivial task (3+ steps)

## Code Style

- TypeScript strict mode
- Server Components by default, `'use client'` only for interactivity
- Zod schemas in `src/lib/validators.ts`
- All async in try/catch, user-friendly error messages
- API response format: `{ data: T }` or `{ error: string, code: number }`
- Reusable hooks in `/src/hooks`
- Comments in Russian for complex business logic only

## Project Structure

```
/src/app
  /page.tsx                          — landing
  /agents/page.tsx                   — catalog with filters, search, sorting
  /agents/[slug]/page.tsx            — agent detail page
  /dashboard/page.tsx                — buyer dashboard
  /dashboard/agents/[id]/page.tsx    — agent management (logs, on/off, reconfigure)
  /seller/page.tsx                   — seller panel
  /seller/agents/new/page.tsx        — create new agent
  /seller/agents/[id]/edit/page.tsx  — edit agent
  /seller/payouts/page.tsx           — payout history
  /admin/page.tsx                    — admin panel
  /auth/callback/route.ts            — OAuth callback (Google, GitHub)
  /auth/telegram/route.ts            — Telegram Login verification + session
  /api
    /checkout/route.ts               — creates checkout session with selected provider
    /webhooks/yookassa/route.ts      — YooKassa webhooks
    /webhooks/cryptomus/route.ts     — Cryptomus webhooks
    /agents/route.ts                 — CRUD agents
    /agents/[id]/reviews/route.ts    — CRUD reviews
    /subscriptions/[id]/deploy/route.ts   — deploy container
    /subscriptions/[id]/stop/route.ts     — stop container
    /subscriptions/[id]/restart/route.ts  — restart container
    /subscriptions/[id]/logs/route.ts     — get logs
    /seller/onboarding/route.ts      — seller onboarding with provider
    /seller/stats/route.ts           — seller stats
    /admin/agents/[id]/moderate/route.ts — approve/reject agent

/src/components
  /layout/Header.tsx, Footer.tsx, Sidebar.tsx, ThemeToggle.tsx
  /auth/TelegramLoginButton.tsx, OAuthButtons.tsx
  /agents/AgentCard.tsx, AgentGrid.tsx, AgentFilters.tsx, AgentDetails.tsx
  /checkout/ProviderPicker.tsx       — YooKassa / Cryptomus picker
  /dashboard/SubscriptionCard.tsx, LogViewer.tsx, SetupWizard.tsx, StatusBadge.tsx
  /seller/AgentForm.tsx, SetupSchemaBuilder.tsx, StatsCards.tsx, PayoutTable.tsx
  /admin/ModerationQueue.tsx, PlatformStats.tsx
  /ui/ — shadcn/ui components

/src/lib
  /db.ts              — Drizzle client
  /db/schema.ts       — Drizzle schema
  /encryption.ts      — AES-256-GCM
  /validators.ts      — Zod schemas
  /docker.ts          — dockerode: deploy/stop/restart/logs/status
  /payments/
    /provider.ts      — PaymentProvider interface
    /yookassa.ts      — YooKassa implementation
    /cryptomus.ts     — Cryptomus implementation
    /index.ts         — getProvider(name) -> PaymentProvider
  /auth/
    /telegram.ts      — Telegram Login HMAC verification

/src/middleware.ts
/src/hooks/useSubscriptions.ts, useAgentLogs.ts, useSellerStats.ts
```

## Security

- User configs: AES-256-GCM, key in `ENCRYPTION_KEY`, decrypt only at deploy time
- Webhook verification: YooKassa — IP + signature, Cryptomus — MD5 sign
- Telegram Login: HMAC-SHA256, `auth_date` < 24h
- Rate limiting on API routes
- Zod validation on all incoming data
- Middleware role checks on `/seller/*`, `/admin/*`, `/dashboard/*`

## Auth

4 login methods, all lead to single `profiles` record:

1. **Telegram Login Widget** (primary for RU) — HMAC-SHA256 verification, BetterAuth session
2. **Google OAuth** — standard BetterAuth flow
3. **GitHub OAuth** — standard BetterAuth flow
4. **Email OTP** — fallback

## Lessons

*Empty — will be filled as mistakes happen.*
