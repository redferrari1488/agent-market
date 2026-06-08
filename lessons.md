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
- `docker compose exec -T` внутри `ssh 'bash -s' <<HEREDOC` ест stdin самого heredoc-скрипта → команды после первого `exec` молча не выполняются (2026-06-05: миграция «прошла» вхолостую, вывод оборвался после 1-го шага, `EXAMPLES required` остался `true`). ПРАВИЛО: данные в контейнер на VPS подавай через pipe отдельным вызовом (`cat file | ssh host "docker compose exec -T … psql"`), не собирай многошаговый heredoc-скрипт с несколькими `exec`.
- Чистка мёртвого кода через `knip`: ВСЕГДА верифицировать кандидаты руками перед удалением — есть систематические false positives. Подтверждённые (2026-06-08): (1) рантайм-строки невидимы статике — `pino-pretty` как `transport.target` в `logger.ts`; (2) CSS-модули и условно-монтируемые dev-компоненты; (3) unused exports часто зарезервированы под будущие фазы (`compute.ts` commission = Phase 1). Удалять только файлы с 0 ссылок (grep по имени И по import-пути, включая относительный), затем `tsc + eslint + next build` как доказательство. `scripts/*` и `drafts/*` — вне графа сборки, это не «мёртвый код приложения».
- Перед производством маркетинга/рекламы под КОНКРЕТНЫЙ агент — сверить, что он реально доступен к продаже (published, не waitlist/draft), а не просто есть в каталоге. 2026-06-09: сделал полный арсенал (SEO-лендинги, аутрич, лид-магнит, видео) под 3 «локомотива», и 2 из них (`review-responder-2gis`, `telegram-support-bot`) оказались waitlist — checkout их блокирует (`if (agent.waitlistOnly)`), купить нельзя. Источник правды по готовности — `LANDING_FEATURED_SLUGS` + waitlist-комментарий в `src/app/page.tsx`, а не список slug в БД. Реклама под недоступный продукт = слив трафика в «лист ожидания» + риск возвратов и негатива. ПРАВИЛО: статус готовности агента проверять ДО написания контента под него, не после.
