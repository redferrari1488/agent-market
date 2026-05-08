# Hireon Postgres backup

Daily `pg_dump` of the `agentmarket` database into `/var/backups/hireon/`,
gzipped, retention 7 days. Driven by a systemd timer that runs at 03:00 UTC.

## Files

- `hireon-db-backup.sh` — script installed at `/usr/local/bin/hireon-db-backup.sh`.
- `hireon-db-backup.service` — systemd one-shot unit.
- `hireon-db-backup.timer` — daily timer.

## Install on the VPS

Run from the repo on the VPS (`/opt/agent-market`):

```bash
sudo install -m 0755 infra/backup/hireon-db-backup.sh /usr/local/bin/hireon-db-backup.sh
sudo install -m 0644 infra/backup/hireon-db-backup.service /etc/systemd/system/hireon-db-backup.service
sudo install -m 0644 infra/backup/hireon-db-backup.timer /etc/systemd/system/hireon-db-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now hireon-db-backup.timer
```

## Verify

```bash
# Dry run the script once
sudo /usr/local/bin/hireon-db-backup.sh

# Inspect the produced file
ls -lh /var/backups/hireon/

# Check timer schedule + next firing
systemctl list-timers hireon-db-backup.timer

# Tail the last run
journalctl -u hireon-db-backup.service -n 50 --no-pager
```

## Restore

```bash
# pick the dump you want
gunzip -c /var/backups/hireon/db_YYYYMMDDTHHMMSSZ.sql.gz \
  | docker compose -f /opt/agent-market/docker-compose.yml exec -T postgres \
    psql -U agentmarket -d agentmarket
```

## Tuning via env

The script reads these (with safe defaults):

- `HIREON_BACKUP_DIR` — default `/var/backups/hireon`
- `HIREON_COMPOSE_DIR` — default `/opt/agent-market`
- `HIREON_BACKUP_RETENTION_DAYS` — default `7`
- `HIREON_DB_USER` — default `agentmarket`
- `HIREON_DB_NAME` — default `agentmarket`
