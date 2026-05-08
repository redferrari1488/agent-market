# Hireon billing cron units

systemd timers that drive the recurring billing endpoints. Each unit reads
`/opt/agent-market/.env`, gates execution on real provider credentials being
present in `.env`, and on success calls the corresponding `/api/cron/*` route
through `curl` with the shared `CRON_SECRET` header.

| Service                            | Endpoint                              | Schedule       |
| ---------------------------------- | ------------------------------------- | -------------- |
| `hireon-yookassa-recurring`        | `/api/cron/yookassa-recurring`        | daily 06:00 UTC |
| `hireon-cryptomus-payout-retry`    | `/api/cron/cryptomus-payout-retry`    | every 6h, UTC  |

## Why YooKassa has no `WEBHOOK_SECRET` gate

YooKassa does not sign webhooks; their docs require server-side IP allowlisting
instead, and the app implements that in
`src/app/api/webhooks/yookassa/route.ts`. The earlier unit guarded execution
on `YOOKASSA_WEBHOOK_SECRET`, which the code never reads, so the timer was
silently `Skipped due to 'exec-condition'` even with live credentials. The
unit shipped here only checks `YOOKASSA_SHOP_ID` + `YOOKASSA_SECRET_KEY`.

Cryptomus does HMAC-sign webhooks, so its unit keeps the
`CRYPTOMUS_WEBHOOK_SECRET` requirement.

## Install on the VPS

Run from the repo on the VPS (`/opt/agent-market`):

```bash
sudo install -m 0644 infra/cron/hireon-yookassa-recurring.service /etc/systemd/system/hireon-yookassa-recurring.service
sudo install -m 0644 infra/cron/hireon-yookassa-recurring.timer   /etc/systemd/system/hireon-yookassa-recurring.timer
sudo install -m 0644 infra/cron/hireon-cryptomus-payout-retry.service /etc/systemd/system/hireon-cryptomus-payout-retry.service
sudo install -m 0644 infra/cron/hireon-cryptomus-payout-retry.timer   /etc/systemd/system/hireon-cryptomus-payout-retry.timer
sudo systemctl daemon-reload
sudo systemctl enable --now hireon-yookassa-recurring.timer
sudo systemctl enable --now hireon-cryptomus-payout-retry.timer
```

## Verify

```bash
# Next firing
systemctl list-timers hireon-yookassa-recurring.timer hireon-cryptomus-payout-retry.timer

# What ExecCondition would do right now
systemctl start hireon-yookassa-recurring.service
journalctl -u hireon-yookassa-recurring.service -n 20 --no-pager

# Manual hit (should be 200, ignored if no due subscriptions)
curl -fsS -H "x-cron-secret: $(grep ^CRON_SECRET /opt/agent-market/.env | cut -d= -f2-)" \
  http://127.0.0.1:3000/api/cron/yookassa-recurring
```

A run that exits via `Skipped due to 'exec-condition'` means the relevant
provider credentials are not configured yet. A run that hits the endpoint
with no due subscriptions returns `{"processed":0,"succeeded":0,"failed":0}`.
