# Trivy remediation check - 2026-04-21

Host checked: `root@100.79.2.56`

## Test images built from current workspace

- `codex-sec-test/content-writer:20260421`
- `codex-sec-test/competitor-monitor:20260421`
- `codex-sec-test/news-digest-bot:20260421`
- `codex-sec-test/review-responder-2gis:20260421`
- `codex-sec-test/website-monitor:20260421`
- `codex-sec-test/ai-support-bot:20260421`

## What changed

- Upgraded Debian security packages in all agent images during build.
- Upgraded `setuptools` and `wheel` in all agent images.
- Upgraded `cryptography` and `urllib3` in `website-monitor`.
- Added read-only-rootfs-safe image prep for the four single-container Python agents by creating `/data` paths in-image with owner `1000:1000`.

## Trivy result summary

- `content-writer`: clean
- `competitor-monitor`: clean
- `news-digest-bot`: clean
- `review-responder-2gis`: clean
- `website-monitor`: clean
- `ai-support-bot`: still not clean

## Remaining finding

`ai-support-bot` still has:

- `h11` `CVE-2025-43859` (`CRITICAL`)

Reason:

- upstream `father-bot/chatgpt_telegram_bot` still pins `python-telegram-bot==20.1`
- that dependency chain pulls `httpcore 0.16.3`, which requires `h11 < 0.15`
- direct `h11==0.16.0` override fails `pip check`

So this one is an upstream/framework compatibility issue, not just an unbumped leaf package.

## Accepted risk (internal prod gate)

`ai-support-bot` keeps this Trivy finding as an accepted internal risk for V1.

Why this is currently considered non-applicable:

- `CVE-2025-43859` targets HTTP server-side request parsing/smuggling behavior.
- `ai-support-bot` in this deployment does not expose an inbound HTTP listener.
- the container acts as an outbound-only client to the Telegram Bot API and the AI API
- no ports are published for this container in the marketplace runtime

Defense-in-depth that still applies:

- `CapDrop: ["ALL"]`
- `SecurityOpt: ["no-new-privileges:true"]`
- Docker default seccomp profile

Reassess this finding on the next Trivy scan or when upstream can move from
`python-telegram-bot==20.1` to a chain that allows `httpcore 1.x` / `h11 0.16+`
(for example PTB 21.x).

## Runtime hardening smoke test

The following profile was tested successfully for the four shipped single-container Python agents:

- `User: 1000:1000`
- `ReadonlyRootfs: true`
- `Tmpfs: /tmp`
- named volume mounted at `/data`

Smoke-test result:

- `content-writer`: passed
- `competitor-monitor`: passed
- `news-digest-bot`: passed
- `review-responder-2gis`: passed

`website-monitor` remains intentionally outside this stricter profile.
