#!/usr/bin/env bash
# Restore-test для бэкапов hireon-db-backup.sh.
# Поднимает изолированный postgres:16-alpine контейнер на свободном порту,
# рестрит самый свежий .sql.gz из /var/backups/hireon/, проверяет что
# core-таблицы существуют и agents.status='published' содержит ≥ 6 строк
# (последний инвариант — рост каталога не должен снижать planka).
#
# Запуск: sudo /opt/agent-market/infra/backup/hireon-db-restore-test.sh
# Выход 0 = бэкап восстанавливается, схема валидна, основные таблицы есть.
# Выход !=0 = что-то пошло не так, бэкап нужно лечить.

set -Eeuo pipefail

BACKUP_DIR="${HIREON_BACKUP_DIR:-/var/backups/hireon}"
SANDBOX_IMAGE="${HIREON_RESTORE_IMAGE:-postgres:16-alpine}"
SANDBOX_NAME="hireon-restore-test-$(date +%s)-$$"
SANDBOX_PORT="${HIREON_RESTORE_PORT:-15432}"
MIN_PUBLISHED_AGENTS="${HIREON_MIN_PUBLISHED_AGENTS:-6}"
READY_TIMEOUT_SEC="${HIREON_READY_TIMEOUT_SEC:-60}"

# Самый свежий дамп (lexicographic = timestamp, ISO-8601 имена)
latest="$(ls -1 "${BACKUP_DIR}"/db_*.sql.gz 2>/dev/null | sort | tail -1)"
if [ -z "${latest}" ]; then
  echo "[restore-test] ERROR: no backups found in ${BACKUP_DIR}" >&2
  exit 1
fi

size_bytes="$(stat -c%s "${latest}")"
echo "[restore-test] backup: ${latest} (${size_bytes} bytes)"

if [ "${size_bytes}" -lt 4096 ]; then
  echo "[restore-test] ERROR: backup is suspiciously small (<4KB)" >&2
  exit 1
fi

cleanup() {
  docker rm -f "${SANDBOX_NAME}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "[restore-test] starting ${SANDBOX_IMAGE} as ${SANDBOX_NAME} on 127.0.0.1:${SANDBOX_PORT}"
docker run -d --rm \
  --name "${SANDBOX_NAME}" \
  -e POSTGRES_USER=agentmarket \
  -e POSTGRES_PASSWORD=restore-test-only \
  -e POSTGRES_DB=agentmarket \
  -p "127.0.0.1:${SANDBOX_PORT}:5432" \
  "${SANDBOX_IMAGE}" >/dev/null

echo "[restore-test] waiting for sandbox postgres to be ready..."
ready=0
for _ in $(seq 1 "${READY_TIMEOUT_SEC}"); do
  if docker exec "${SANDBOX_NAME}" pg_isready -U agentmarket -q 2>/dev/null; then
    ready=1
    break
  fi
  sleep 1
done

if [ "${ready}" -ne 1 ]; then
  echo "[restore-test] ERROR: sandbox postgres did not become ready in ${READY_TIMEOUT_SEC}s" >&2
  echo "--- container logs ---" >&2
  docker logs "${SANDBOX_NAME}" 2>&1 | tail -20 >&2
  exit 1
fi

echo "[restore-test] restoring dump..."
# ON_ERROR_STOP=1 чтобы любая SQL-ошибка во время restore валила restore с
# ненулевым кодом. Без неё psql проглатывает ошибки и продолжает.
if ! gunzip -c "${latest}" \
  | docker exec -i "${SANDBOX_NAME}" \
      psql -U agentmarket -d agentmarket -v ON_ERROR_STOP=1 >/dev/null; then
  echo "[restore-test] ERROR: restore failed" >&2
  exit 1
fi

echo "[restore-test] verifying core tables..."
# Core-таблицы которые ДОЛЖНЫ существовать в любом валидном бэкапе.
# Если хоть одна отсутствует — schema/dump повреждён.
core_tables=(user profiles agents subscriptions reviews payouts audit_logs)
for tbl in "${core_tables[@]}"; do
  count="$(docker exec "${SANDBOX_NAME}" psql -U agentmarket -d agentmarket -tAc \
    "SELECT count(*) FROM \"${tbl}\";" 2>&1 || echo "FAIL:$?")"
  if ! [[ "${count}" =~ ^[0-9]+$ ]]; then
    echo "[restore-test] ERROR: ${tbl} returned non-numeric (${count})" >&2
    exit 1
  fi
  printf '  %-15s %s rows\n' "${tbl}" "${count}"
done

echo "[restore-test] verifying business invariants..."
published="$(docker exec "${SANDBOX_NAME}" psql -U agentmarket -d agentmarket -tAc \
  "SELECT count(*) FROM agents WHERE status='published';")"
echo "  published agents: ${published}"
if [ "${published}" -lt "${MIN_PUBLISHED_AGENTS}" ]; then
  echo "[restore-test] ERROR: expected >=${MIN_PUBLISHED_AGENTS} published agents, got ${published}" >&2
  exit 1
fi

echo "[restore-test] PASS"
