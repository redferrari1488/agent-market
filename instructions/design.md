# Design — Instruction Module

**READ THIS ENTIRE FILE before starting any UI/UX task.**

## Visual System (Phase A — current)

- Dark theme by default, light/dark toggle in Header
- shadcn/ui as component base
- framer-motion: scroll reveal, hover effects, transitions
- Mobile-first

## Color Palette

- Background: `#0a0a0f`
- Cards: `#12121a`
- Borders: `#1e1e2e`
- Accent: gradient `from-violet-600 to-blue-500`

## Exact CSS Tokens (copy-paste reference)

- **Mono labels:** `font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground`
- **Cards:** `rounded-lg border border-border/40`
- **CTA buttons:** `bg-foreground text-background hover:opacity-90`
- **Section spacing:** `py-20 sm:py-28`
- **Headings:** `text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]`
- **Body text:** `text-[13px]`-`[15px] text-muted-foreground`

## STRICT Design Rules

After Phase A redesign (21 files cleaned), these are non-negotiable:

- **NO gradient text** (bg-gradient-to-r + bg-clip-text)
- **NO glow blobs** (absolute + blur-3xl + opacity)
- **NO glassmorphism** (backdrop-blur + bg-white/5)
- **NO violet/blue decorative backgrounds**
- **NO gradient buttons** -> use `bg-foreground text-background`
- **NO rounded-2xl** -> use `rounded-lg`
- **NO backdrop-blur anywhere**

## Copy Rules

- **NO developer jargon** in buyer-facing copy: Docker, VPS, SSH, container, image, deploy, setup schema, wizard
- **Use instead:** agents, cloud, step-by-step setup, launch
- **Hyphens (-)** instead of em dashes (-) in ALL user-facing text
- **NO fake tech metrics** (RAM 84 MB, 256 MB memory) -> use buyer-relevant metrics (Success 99.2%, Dedicated memory and CPU)

## Landing Page Structure

1. **Hero:** centered copy + HeroDashboardMock (buyer-facing mock with activity feed, stats row, streaming logs, sidebar with agents)
2. **How it works:** 3 steps with border-l-2
3. **Catalog:** top-3 agents from DB via AgentGrid
4. **Seller section:** giant "85" (percent revenue) + copy

### HeroDashboardMock Details
- Sidebar 200px with agent list
- Activity feed
- Stats row: Uptime / Messages / Avg response / Success
- Controls: Stop / Restart
- Streaming logs with cursor pulse
- Notification bell with badge

## Component Patterns

- Agent cards: category icon (lucide), name, 2-line description, price/mo, rating, category badge, purchase count
- Skeleton loading states + empty states for all data-driven pages

## Files Touched in Phase A (reference for future consistency checks)

agents/page.tsx, agents/[slug]/page.tsx, AgentFilters.tsx, PurchaseButton.tsx, AgentDetails.tsx, dashboard/page.tsx, dashboard/agents/[id]/page.tsx, ManageView.tsx, SetupWizard.tsx, LogViewer.tsx, seller/page.tsx, seller/agents/new/page.tsx, seller/agents/[id]/edit/page.tsx, StatsCards.tsx, AgentForm.tsx, SetupSchemaBuilder.tsx, auth/login/page.tsx, LoginForm.tsx, OAuthButtons.tsx, about/page.tsx, admin/page.tsx.

## Lessons

*Empty — will be filled as mistakes happen.*
