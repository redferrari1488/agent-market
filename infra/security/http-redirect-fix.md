# HTTP Redirect Fix

Date: 2026-04-22

## Change

- Replaced the `listen 80 default_server` fallback in `infra/nginx/nginx.conf` so IP-based HTTP requests no longer proxy to `next_app`.
- Preserved `/.well-known/acme-challenge/` on plain HTTP for Certbot.
- Added a dedicated `listen 443 ssl default_server` block with `http2 on;` that returns `444` for non-matching TLS/SNI traffic instead of falling through to the canonical app server.
- Updated the 443 blocks to modern `http2 on;` syntax and removed ineffective `ssl_stapling` directives that only produced warnings with the current certificate chain.

## VPS Verification

Deployment note:

- Copying a bind-mounted single file with `scp` replaced the host inode, so `nginx -s reload` inside the running container kept reading the old mounted inode.
- Fix: recreate the `nginx` service with `docker compose up -d --force-recreate nginx` after copying the updated file.

Results:

- `docker compose exec nginx nginx -t`: syntax successful after the final config cleanup.
- `curl -sI http://77.239.104.149/`: `301 Moved Permanently` with `Location: https://hireon.agency/`.
- `curl -sI https://hireon.agency/`: `200 OK` with HSTS and the expected hardening headers.
- `curl -sI http://77.239.104.149/.well-known/acme-challenge/test`: `404 Not Found` (ACME path still reachable over HTTP, no redirect).
- `curl -sD- "https://hireon.agency/auth/login?next=https://evil.com" -o /dev/null`: `HTTP/2 200`, no `Location` header.
- `curl -sD- "https://hireon.agency/auth/login?next=//evil.com" -o /dev/null`: `HTTP/2 200`, no `Location` header.
- `curl -sD- "https://hireon.agency/auth/login?next=%2F%2Fevil.com" -o /dev/null`: `HTTP/2 200`, no `Location` header.
- `curl -skI https://77.239.104.149/`: connection closed without response (`444`-style behavior, curl exit code `92`), so non-matching HTTPS traffic no longer falls into the canonical app server.
