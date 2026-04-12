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

*Empty — will be filled as mistakes happen.*
