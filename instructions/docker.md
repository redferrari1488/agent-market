# Docker — Instruction Module

**READ THIS ENTIRE FILE before working on Docker/container management.**

## Container Management (src/lib/docker.ts)

dockerode for programmatic container management on VPS.

### Container Naming

Container name: `agent-{subscription_id}`

### Container Config

- env vars = decrypted user `config` + agent `env_template`
- restart policy: `unless-stopped`
- limits: 256MB RAM + 0.5 CPU

### Functions

- `deployContainer(subscriptionId, image, envVars)` — create and start
- `stopContainer(subscriptionId)` — stop
- `restartContainer(subscriptionId)` — restart
- `getContainerLogs(subscriptionId, tail=100)` — last N lines
- `getContainerStatus(subscriptionId)` — `running|stopped|error`

### API Routes

- `POST /api/subscriptions/[id]/deploy` — deploy container
- `POST /api/subscriptions/[id]/stop` — stop container
- `POST /api/subscriptions/[id]/restart` — restart container
- `GET /api/subscriptions/[id]/logs` — get logs

### Env

```
DOCKER_HOST=ssh://user@vps-ip
```

## Lessons

- **2026-05-17 (аудит):** НИКОГДА не запускать `docker image prune -a` (с `-a`)
  на VPS. Флаг сносит ВСЕ образы к которым нет работающих контейнеров — а у
  нас образы агентов (`agent-market/<slug>:latest`) живут как «cold storage»:
  контейнер появляется только когда юзер деплоит подписку. `-a` снёс все 6
  образов разом, следующая подписка упала бы с `no such image`. Спасся тем
  что заметил сразу и пересобрал. Правильный способ — `docker image prune -f`
  (без `-a`) для dangling-только, или вообще `docker builder prune -f`
  отдельно для build cache.
- **2026-05-17 (аудит):** Контейнер агента в `Restarting (1)` 200+ раз — это
  не баг docker, это сломанный config попавший в прод ДО валидации. Лечится
  `docker rm -f` + `UPDATE subscriptions SET status='paused', container_id=NULL`.
  Volume `agent-<id>-data` НЕ удалять — там state агента (snapshots/seen-posts),
  юзер переоткроет Настройки и передеплоится без потерь.
