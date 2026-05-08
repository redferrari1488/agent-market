#!/usr/bin/env bash
# Daily Postgres backup for hireon.agency
# Dumps the `agentmarket` database from the postgres compose service
# into /var/backups/hireon/, gzipped, and prunes anything older than 7 days.
set -Eeuo pipefail

BACKUP_DIR="${HIREON_BACKUP_DIR:-/var/backups/hireon}"
COMPOSE_DIR="${HIREON_COMPOSE_DIR:-/opt/agent-market}"
RETENTION_DAYS="${HIREON_BACKUP_RETENTION_DAYS:-7}"
DB_USER="${HIREON_DB_USER:-agentmarket}"
DB_NAME="${HIREON_DB_NAME:-agentmarket}"

ts="$(date -u +%Y%m%dT%H%M%SZ)"
out="${BACKUP_DIR}/db_${ts}.sql.gz"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

cd "${COMPOSE_DIR}"

echo "[hireon-db-backup] dumping ${DB_NAME} -> ${out}"
docker compose exec -T postgres \
  pg_dump --clean --if-exists --no-owner --no-privileges \
  -U "${DB_USER}" -d "${DB_NAME}" \
  | gzip -9 > "${out}.tmp"

mv "${out}.tmp" "${out}"
chmod 600 "${out}"

size="$(stat -c%s "${out}")"
echo "[hireon-db-backup] wrote ${out} (${size} bytes)"

if [ "${size}" -lt 4096 ]; then
  echo "[hireon-db-backup] ERROR: dump is suspiciously small (<4KB)" >&2
  exit 1
fi

echo "[hireon-db-backup] pruning files older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'db_*.sql.gz' -mtime "+${RETENTION_DAYS}" -print -delete

echo "[hireon-db-backup] done"
