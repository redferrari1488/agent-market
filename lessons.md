# Lessons

## Routing

| Direction | Lessons location |
|---|---|
| Coding | `instructions/coding.md` -> Lessons section |
| Design | `instructions/design.md` -> Lessons section |
| Payments | `instructions/payments.md` -> Lessons section |
| Docker | `instructions/docker.md` -> Lessons section |
| Agent Building | `instructions/agents-build.md` -> Lessons section |

## Universal Lessons

*Applied to ALL directions.*

- Phase A cleanup removed all AI-slop (gradient text, glow blobs, backdrop-blur, glassmorphism) -> NEVER re-introduce these patterns without explicit approval
- Developer jargon was cleaned from copy (Docker, wizard, image) -> ALWAYS use buyer-relevant language in user-facing text
- SSH-туннель `ssh -fNL 5432:localhost:5432 aimbot-public` ведёт прямо в прод-БД (не staging). 2026-05-22 я применил breaking schema-change (`features` `string[]` → `{title, desc}[]`) через туннель до деплоя кода → прод упал с `Objects are not valid as a React child`. ПРАВИЛО: через туннель — только SELECT. Любая DDL/DML — сначала git push + docker rebuild, потом БД-апдейт. Никогда не наоборот.
