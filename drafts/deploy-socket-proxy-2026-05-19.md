# Деплой: Docker socket proxy + agent network

Дата: 2026-05-19. Делалось пока юзер не за ноутом.

## Что изменено (local, ещё не закоммичено)

- `docker-compose.yml` (+72 / -8)
  - Новый service `socket-proxy` (`tecnativa/docker-socket-proxy@sha256:9e4b9e7…`),
    pinned by digest. Scope: `CONTAINERS,IMAGES,VOLUMES,NETWORKS,INFO,POST`.
    Всё остальное denied. `read_only`, `cap_drop: ALL`, `no-new-privileges`,
    `SETUID/SETGID` только под haproxy bind.
  - У `app`: убран bind `/var/run/docker.sock` и `group_add: 988`. Добавлены
    `DOCKER_HOST=tcp://socket-proxy:2375` и `AGENT_NETWORK=agent-market_agents`.
  - Networks: `default` (app+postgres+nginx, имя зафиксировано), `socket-tier`
    (`internal: true`, app↔socket-proxy), `agents` (для agent-контейнеров,
    postgres сюда не подключён).
- `src/lib/docker.ts` (+33 / -5)
  - Парсер `DOCKER_HOST=tcp://host:port` (теперь корректно, раньше передавал
    весь URL в `host`, был бы баг при тестах через proxy).
  - `NetworkMode: AGENT_NETWORK` при `createContainer` → agent-контейнеры
    попадают в `agent-market_agents`, не в default bridge.

Компиляция: `npx tsc --noEmit` зелёная.

## Что это закрывает

- **Docker socket host-escape:** compromise `app` ≠ root на хосте. Proxy
  не даёт `BUILD/EXEC/SWARM/SYSTEM` и не bind'ит сокет в app.
- **Agent → postgres reachability по hostname:** postgres резолвится только
  внутри `agent-market_default`. Agents живут в `agent-market_agents`, в
  postgres попасть нельзя даже теоретически (DNS не отвечает, IP другой).

## План деплоя (DO NOT DO без approval)

Предусловия:
- На проде сейчас 0 active subscriptions (agent containers). Если появятся
  до деплоя — их надо снова рестартнуть после, чтобы попали в новую network.
- Образ `tecnativa/docker-socket-proxy:0.3.0` уже pulled на VPS (digest
  совпадает с тем что в compose).

Команды (выполнить в одной SSH-сессии):

```bash
# 1. Прокачать изменения (после git push с локали)
cd /opt/agent-market && git pull

# 2. Поднять socket-proxy первым (отдельная сеть нужна app'у)
docker compose up -d socket-proxy

# 3. Пересобрать и поднять app (он подтянет DOCKER_HOST + AGENT_NETWORK,
#    отвалится от старой docker.sock-bind)
docker compose up -d --build app

# 4. Проверки сразу:
docker compose ps                       # все Up
docker logs --tail=20 agent-market-socket-proxy-1
docker logs --tail=30 agent-market-app-1 | grep -iE "(docker|error)"
docker exec agent-market-app-1 sh -c "wget -qO- http://socket-proxy:2375/version" | head -2

# 5. Smoke: проверить что dockerode из app достучался к proxy
curl -sS https://hireon.agency/ -o /dev/null -w "%{http_code}\n"

# 6. (опц) Создать тестовый agent-контейнер через UI или вручную и проверить:
docker inspect agent-<sub-id> --format '{{.HostConfig.NetworkMode}}'  # → agent-market_agents
docker network inspect agent-market_agents --format '{{range .Containers}}{{.Name}} {{end}}'
```

## Rollback

Если что-то падает после `docker compose up -d --build app`:

```bash
cd /opt/agent-market && git revert HEAD --no-edit && git push  # (с локали)
# на VPS:
cd /opt/agent-market && git pull && docker compose up -d --build app
docker compose stop socket-proxy && docker compose rm -f socket-proxy
docker network rm agent-market_socket-tier agent-market_agents 2>/dev/null || true
```

`pgdata` volume не трогается ни на одном этапе — БД жива.

## Что НЕ делалось

- Trivy fixes для agent-образов (см. trivy-2026-05-19.md):
  - `ai-support-bot`: litellm 1.83.0→1.83.7+, lxml 6.0.4→6.1.0, urllib3 2.6.3→2.7.0
    закрывают 1 CRITICAL + 3 HIGH (fixable upstream)
  - Python-агенты (content-writer/competitor-monitor/news-digest-bot/
    review-responder-2gis): 4 одинаковых HIGH из debian 13.5 base
    (ncurses CVE-2025-69720 и т.п.) — все `will_not_fix`/`affected`.
    Базу можно сменить на python:3.11-alpine (другой libc) — но это
    отдельный риск, requires testing.
  - `website-monitor`: 6 HIGH + 1 CRITICAL — все `will_not_fix` от upstream
    (mesa, libtheora, libxml2). Accepted risk как раньше.
  - `agent-market-app`: protobufjs + tar HIGH через npm — fixable
    обычным `npm update`.

  Эти фиксы — отдельный коммит, не блокер для socket-proxy/agent-network.
