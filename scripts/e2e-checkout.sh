#!/usr/bin/env bash
# Враппер для e2e-checkout.mjs — запускает скрипт в одноразовом node:22-slim
# контейнере с npm pg (установлен на лету), env из /opt/agent-market/.env,
# доступом к docker-сети (app + postgres) и app по http://app:3000.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Postgres password — из .env, нужен в PGPASSWORD для pg-клиента.
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  if [ -f "${REPO_ROOT}/.env" ]; then
    POSTGRES_PASSWORD="$(grep -E '^POSTGRES_PASSWORD=' "${REPO_ROOT}/.env" | head -1 | cut -d= -f2-)"
  fi
fi
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-changeme}"

# Имя docker-сети: docker-compose именует <project>_<network>. Дефолт project name
# = имя каталога с лоуэркейсом + без дефисов? Сейчас на VPS сеть называется
# "agent-market_default". Если переедет — можно передать E2E_NETWORK env.
NETWORK="${E2E_NETWORK:-agent-market_default}"

# pg ставится в /tmp чтобы не оседать в /scripts (ro). npm доступен в node:22-slim.
exec docker run --rm \
  --network "${NETWORK}" \
  --env-file "${REPO_ROOT}/.env" \
  -e APP_URL=http://app:3000 \
  -e PGHOST=postgres \
  -e PGUSER=agentmarket \
  -e PGDATABASE=agentmarket \
  -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  -v "${REPO_ROOT}/scripts":/scripts:ro \
  -w /tmp \
  node:22-slim \
  sh -c "npm i pg --no-save --silent 2>/dev/null && node /scripts/e2e-checkout.mjs"
