# Hireon — a marketplace of ready-made AI agents

Not prompts, but working systems: the buyer picks an agent, pays (subscription
or one-off), goes through a Setup Wizard, and the platform spins up a Docker
container with that agent on a VPS, where it runs 24/7.

**Phase 0 (pre-launch):** only the platform's own agents are for sale
(`seller_id = NULL`); third-party sellers list for free, no commission yet.
Market: Russia (primary) plus international, with two payment providers.

**Status:** the production deployment (`hireon.agency`, Docker Compose on a VPS,
Let's Encrypt, six published agents) was live and has been switched off after a
demand check. The code and the deployment path are intact.

Russian version of this file: [README.ru.md](README.ru.md).

## Stack

- **Frontend:** Next.js 16 (App Router, TS strict), Tailwind v4, shadcn/ui, framer-motion
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Drizzle ORM, BetterAuth (Telegram Login)
- **Payments:** YooKassa (Russia) + NowPayments (crypto / international)
- **Agents:** Docker containers via dockerode → tecnativa/docker-socket-proxy on the VPS
- **AI:** OpenRouter (managed key for Hireon's own agents), Python 3.11 agents
- **Other:** Zod (validation), AES-256-GCM (config encryption), pino + Telegram alerts

## Development

```bash
npm install
cp .env.local.example .env.local   # fill in the secrets
npm run dev                         # http://localhost:3000
```

### Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (unit tests for pure functions: money, encryption,
                    #         config validation, IP whitelist, telegram HMAC, reconciler)
npm run build       # next build (pre-deploy check; needs database access)
```

CI (`.github/workflows/ci.yml`) runs typecheck + lint + test on every push and PR.

## Deployment

```bash
git push && ssh aimbot-public 'cd /opt/agent-market && git pull && docker compose up -d --build app'
```

Database migrations are applied by hand (`db/migrations/`, `db/seeds/`) — see `instructions/`.
Cron timers (recurring charges + reconciler) live in `infra/cron/`.

## Layout

| Directory | What is there |
|---|---|
| `src/app/` | Pages and API routes (checkout, webhooks, cron, subscription lifecycle, admin/seller) |
| `src/lib/` | Core: `docker.ts`, `payments/`, `encryption.ts`, `auth*`, `validators.ts`, `net/ip.ts` |
| `src/components/` | UI (landing, catalog, dashboard) |
| `agents-src/` | Docker images of the Python agents |
| `db/` | `migration.sql` (init) + `migrations/` (manual) + `seeds/` |
| `infra/` | nginx, fail2ban, systemd timers (backup / restore-test / cron), security reports |

## Documentation

- `CLAUDE.md` — project instructions and facts (task routing into `instructions/`)
- `PROJECT_CONTEXT.md` — shared context across devices
- `lessons.md` — incident and pattern log
- `todo.md` — current tasks

Project documentation is kept in Russian.
