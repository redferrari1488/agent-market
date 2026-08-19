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

## Git deploy auth (VPS)

Прод тянет код по **read-only SSH deploy key**, не по токену в URL remote.

- VPS: ключ `/root/.ssh/agent_market_deploy` (ed25519) + ssh-алиас в `/root/.ssh/config`:
  `Host github-agent-market` → `HostName github.com`, `IdentityFile .../agent_market_deploy`,
  `IdentitiesOnly yes`.
- `remote origin = git@github-agent-market:rodimovartem/agent-market.git`.
- Публичная половина добавлена как **read-only Deploy Key** в репо на GitHub.

**2026-06-14:** так заменён утёкший classic PAT (`ghp_...`), лежавший в открытом виде в
`/opt/agent-market/.git/config` (попал при `git clone https://<token>@github.com/...` при
настройке сервера). Токен отозван. НИКОГДА не возвращать токен в URL remote — только ключ.

## Backup & Restore (Postgres)

### Auto-backup

`hireon-db-backup.timer` (systemd) запускает `infra/backup/hireon-db-backup.sh`
каждый день в 03:00 UTC. Скрипт делает `pg_dump --clean --if-exists` через
`docker compose exec postgres`, gzip-9, кладёт в `/var/backups/hireon/`
с правами 600, ротирует файлы старше 7 дней.

Проверка статуса:

```bash
systemctl status hireon-db-backup.timer
systemctl list-timers hireon-db-backup.timer
journalctl -u hireon-db-backup.service --since "1 day ago"
ls -la /var/backups/hireon/
```

### Ручной backup перед миграциями / опасными изменениями

```bash
sudo /usr/local/bin/hireon-db-backup.sh
# или, если симлинка нет:
sudo /opt/agent-market/infra/backup/hireon-db-backup.sh
```

### Weekly restore-test

`hireon-db-restore-test.timer` запускается воскресенье 06:00 UTC. Поднимает
изолированный `postgres:16-alpine` на `127.0.0.1:15432`, рестрит самый свежий
бэкап, валидирует core-таблицы и инвариант `agents.status='published' >= 6`.
Без этой проверки бэкапы могут «протухнуть» тихо.

Ручной запуск:

```bash
sudo /opt/agent-market/infra/backup/hireon-db-restore-test.sh
```

### Restore prod-БД из бэкапа (DESTRUCTIVE)

**ВНИМАНИЕ**: восстановление перетирает текущую БД. Только если уже точно
понятно что данные потеряны, не вместо нормального дебага.

```bash
# 1. Остановить app чтобы не было записей во время restore
cd /opt/agent-market
docker compose stop app

# 2. Найти нужный бэкап
ls -la /var/backups/hireon/
LATEST=/var/backups/hireon/db_YYYYMMDDTHHMMSSZ.sql.gz

# 3. Сохранить текущее состояние ПЕРЕД restore (safety net)
sudo /opt/agent-market/infra/backup/hireon-db-backup.sh

# 4. Restore (--clean в дампе сам дропнет старые объекты)
gunzip -c "$LATEST" \
  | docker compose exec -T postgres \
      psql -U agentmarket -d agentmarket -v ON_ERROR_STOP=1

# 5. Проверить вручную:
docker compose exec -T postgres psql -U agentmarket -d agentmarket \
  -c "SELECT count(*) FROM agents WHERE status='published';"

# 6. Поднять app обратно
docker compose start app
```

### Offsite backup

Сейчас бэкапы живут только на VPS. Если умрёт диск — данных нет. Добавить
offsite-копию (S3-compatible, B2, R2 и т.п.) когда появятся реальные
платежи. Procedure: после успешного `pg_dump` копировать в bucket через
`rclone copy` или `aws s3 cp`.

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
