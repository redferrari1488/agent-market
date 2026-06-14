# AI Agent Marketplace

## About

Marketplace of ready-made AI agents. Working systems, not prompts: buyer picks an agent, pays subscription or one-time, goes through setup, agent deploys in Docker container and runs 24/7. **Phase 0 (pre-launch): free placement for third-party sellers; no platform commission yet.** Target market: RU (primary) + international users, dual payment providers.

## FIRST ACTION EVERY SESSION

1. Determine task type from user's request
2. Load and READ relevant instruction module(s) from `instructions/`
3. Check `lessons.md` for universal lessons
4. Check memory only if task needs historical context

Do NOT read everything every time. Load only what's needed.

## ROUTING

| Task signals | Module to load |
|---|---|
| Code, bugs, API routes, DB, auth, refactoring | `instructions/coding.md` |
| UI/UX, components, styling, layout | `instructions/design.md` |
| Payments, checkout, webhooks, splits, providers | `instructions/payments.md` |
| Docker containers, deploy, logs, VPS | `instructions/docker.md` |
| Building AI agent images, BYOK, ai_provider | `instructions/agents-build.md` |

If task crosses multiple directions — load multiple modules.

## FILE SYSTEM RULES

### NEVER create files in the project root. EVER.

Every file goes into its designated folder:

```
project-root/
├── instructions/        # Instruction modules (DO NOT modify without approval)
├── agents-src/          # AI agent Docker images
├── src/                 # Next.js application code
├── db/                  # Database migrations
├── supabase/            # Supabase config (legacy)
├── public/              # Static assets
├── lessons.md           # Self-learning lessons
├── todo.md              # Current tasks
├── PROJECT_CONTEXT.md   # Shared project context across devices
└── CLAUDE.md            # This file (DO NOT modify without approval)
```

## Stack (brief)

- Frontend: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, framer-motion
- Backend: Next.js API Routes
- DB: PostgreSQL (Drizzle ORM, BetterAuth)
- Payments: YooKassa (RU) + NowPayments (crypto/international)
- Agents: Docker containers via dockerode on VPS
- Validation: Zod, Icons: lucide-react, Encryption: AES-256-GCM

## DB Schema

**Prices stored in minor currency units (kopecks for RUB, cents for USD).**

Tables: `profiles`, `agents`, `subscriptions`, `reviews`, `agent_logs`, `payouts`.

Full schema in `db/` (Drizzle) and `instructions/coding.md`.

Key constraints:
- `profiles.role`: buyer | seller | admin
- `agents.pricing_model`: subscription | one_time | both
- `agents.status`: draft | review | published | rejected
- `subscriptions.status`: pending_setup | active | paused | cancelled | expired
- `subscriptions.payment_provider`: yookassa | nowpayments
- Admin agents: `seller_id = NULL` -> 100% to platform, no split

## Env Vars (.env.local)

```
# DB
DATABASE_URL=

# Auth (BetterAuth)
BETTER_AUTH_SECRET=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
TELEGRAM_BOT_TOKEN=

# Payments — YooKassa
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_WEBHOOK_SECRET=

# Payments — NowPayments (crypto)
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=

# AI (OpenRouter, managed для Hireon-агентов)
OPENROUTER_API_KEY=

# Infrastructure
DOCKER_HOST=ssh://user@vps-ip
ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Facts

- **Phase 0 (pre-launch):** free placement for third-party sellers. No commission deduction yet. Monetization currently via admin agents + planned boost-promotion. Commission terms TBD post-launch
- Admin agents (seller_id = NULL) -> 100% to platform
- Prices in DB: kopecks RUB. USD prices optional (for Cryptomus)
- AI tokens: **managed via OpenRouter** for Hireon-агентов. На платформе живёт `OPENROUTER_API_KEY` (`.env.local`). В контейнер агента `src/lib/docker.ts` прокидывает его как `OPENAI_API_KEY` + `OPENAI_BASE_URL=https://openrouter.ai/api/v1` (OpenAI SDK совместим). Для сторонних агентов (`seller_id != NULL`) — на стороне продавца
- Default AI provider: **Claude** (`anthropic/claude-sonnet-4-6` через OpenRouter). `ai_provider.py` принимает `AI_PROVIDER=claude|openai` и опц. `AI_MODEL`

## DEPLOYMENT

```bash
# Deploy to VPS (push + rebuild)
git push && ssh aimbot-public 'cd /opt/agent-market && git pull && docker compose up -d --build app'
```

- Public IP: 77.239.104.149
- SSH alias: `aimbot-public`
- Git-auth прода: read-only SSH deploy key (ssh-алиас `github-agent-market`), НЕ токен в URL remote. Детали/восстановление — `instructions/docker.md`
- Backup tag before redesign: `backup/phase-a-pre-redesign` (143611f)

## WORKFLOW ORCHESTRATION

1. **Plan First:** enter plan mode for non-trivial tasks (3+ steps)
2. **Verification:** never mark done without proof
3. **Self-Improvement:** after correction -> update lessons

## END OF SESSION

When user says "end session" / "done for today":
1. Save to lessons ONLY if there was a real mistake or new pattern
2. Update memory ONLY if something important changed
3. Brief summary: what was done, what's left

Do NOT overcomplicate. Only save what will be useful next session.

## Project Workflow

For work across Windows and MacBook, use the repository-level git sync workflow:

- `startproj`: run at the start of a work session. Performs `git pull --rebase`.
- `endproj`: run at the end of a work session. Shows status, asks for confirmation and commit message, then `git add -A`, `git commit`, `git push`.

## Commit And Push Policy

- After completing a meaningful change, commit and push by default unless user says otherwise.
- If context/assumptions/priorities changed, update `PROJECT_CONTEXT.md` in the same changeset.
- Do not leave important context changes only in chat history.
- Avoid noisy commits for empty or insignificant changes.

## NEW WORK DIRECTIONS

When a task doesn't fit any existing direction:
1. ASK the user to confirm this is a new direction
2. Create instruction module: `instructions/<direction-name>.md`
3. Add row to ROUTING table in this file
4. Structure the module same as existing ones

Every work direction MUST have its own instruction module. No exceptions.
