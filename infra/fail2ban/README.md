# fail2ban SSH baseline

This directory stores the minimal fail2ban config for the production VPS.

## Scope

- protects SSH only
- bans after 5 failed attempts within 10 minutes
- keeps the ban for 1 hour
- uses the `systemd` backend expected on Ubuntu 24.04

## Install on the VPS

```bash
apt-get update
apt-get install -y fail2ban
install -d /etc/fail2ban
install -m 644 /opt/agent-market/infra/fail2ban/jail.local /etc/fail2ban/jail.local
systemctl enable --now fail2ban
fail2ban-client status sshd
```

## Update

```bash
install -m 644 /opt/agent-market/infra/fail2ban/jail.local /etc/fail2ban/jail.local
systemctl restart fail2ban
fail2ban-client status sshd
```

## Current production note

As of `2026-04-21`, `fail2ban` is installed and active on `root@100.79.2.56`.
See `infra/security/fail2ban-2026-04-21.md` for the verification snapshot.
