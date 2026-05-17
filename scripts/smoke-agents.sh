#!/usr/bin/env bash
# Враппер для smoke-agents.mjs — запускает node-скрипт в одноразовом
# node:22-slim контейнере с маунтом docker.sock + scripts/. Используем,
# когда на хосте VPS нет установленного node.
#
# Запуск: bash scripts/smoke-agents.sh [slug]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

exec docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "${REPO_ROOT}/scripts":/scripts:ro \
  ${SMOKE_VERBOSE:+-e SMOKE_VERBOSE="${SMOKE_VERBOSE}"} \
  node:22-slim \
  node /scripts/smoke-agents.mjs "$@"
