# Trivy remediation check - 2026-04-22

Host checked: `root@100.79.2.56`

## Gate A - promoted latest images on VPS

The five remediated marketplace images were rebuilt directly on the VPS and now
back the `:latest` tags:

- `agent-market/content-writer:latest`: `16e0ac49dddb`
- `agent-market/competitor-monitor:latest`: `0979318c24e1`
- `agent-market/news-digest-bot:latest`: `57af99ba1f0d`
- `agent-market/review-responder-2gis:latest`: `34f0c560b29e`
- `agent-market/website-monitor:latest`: `50fc27eb292c`

Operational note:

- the instruction `docker build -t agent-market/<name>:latest agents-src/<name>/`
  is incorrect for the four single-container Python agents in this repo
- their Dockerfiles copy shared files from the `agents-src/` root (`ai_provider.py`
  and `<agent>/...`), so the correct build form is
  `docker build --pull -f agents-src/<name>/Dockerfile -t agent-market/<name>:latest agents-src`
- `website-monitor` was rebuilt from `agents-src/website-monitor/` as written

## Gate A - HIGH/CRITICAL summary

The VPS host does not have host-installed `node`/`npm` or `trivy`, so this
round used the equivalent `aquasec/trivy:latest` container commands directly
against the Docker socket.

- `agent-market/content-writer:latest`: HIGH=0, CRITICAL=0
- `agent-market/competitor-monitor:latest`: HIGH=0, CRITICAL=0
- `agent-market/news-digest-bot:latest`: HIGH=0, CRITICAL=0
- `agent-market/review-responder-2gis:latest`: HIGH=0, CRITICAL=0
- `agent-market/website-monitor:latest`: HIGH=0, CRITICAL=0
- `ai-support-bot-bot:latest`: HIGH=10, CRITICAL=1

`ai-support-bot-bot:latest` remains the documented accepted risk from the
previous remediation round and was intentionally left as-is.

## Gate A - restarted subscriptions

No active subscriptions currently reference these five marketplace images on the
production DB, so no subscription containers were redeployed in this round.

Restarted subscription IDs:

- none

## Gate B - SQL migration

Applied on `agent-market-postgres-1`:

```bash
docker exec -i agent-market-postgres-1 psql -U agentmarket -d agentmarket < db/migrations/2026-04-22_rename_recurring_failures_metadata.sql
```

Observed result on first apply:

- `BEGIN`
- `UPDATE 0`
- `COMMIT`

Pre/post checks:

- pre-count `config::text LIKE '%recurring_failures%'`: `0`
- post-count `config::text LIKE '%recurring_failures%'`: `0`

Idempotency check:

- second apply completed successfully
- `_meta_recurring_failures` rows after apply: `0`

So Gate B is safe and complete, but it was a no-op on current production data.
