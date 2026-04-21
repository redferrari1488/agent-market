# ENCRYPTION_KEY rotation runbook

This runbook rotates `ENCRYPTION_KEY` without losing existing encrypted seller or buyer data.

## Encrypted data in scope

- `profiles.cryptomus_wallet_address`
- encrypted values inside `subscriptions.config`

## Preconditions

- schedule a short maintenance window for seller onboarding + subscription reconfiguration writes
- back up the current database and the current `.env`
- generate the new key first and keep the old key until the migration is verified

## 1. Generate a new key

Use a 32-byte key encoded as 64 hex characters:

```bash
openssl rand -hex 32
```

Do not replace the live `.env` value yet.

## 2. Put the app into a write freeze

Pause flows that can update encrypted fields while the migration runs:

- seller Cryptomus onboarding
- subscription setup / reconfiguration

The goal is simple: no writes to encrypted fields during re-encryption.

## 3. Re-encrypt rows

Run a one-off script with both keys available:

- `OLD_ENCRYPTION_KEY=<current>`
- `NEW_ENCRYPTION_KEY=<new>`

For each row:

1. decrypt with `OLD_ENCRYPTION_KEY`
2. encrypt the plaintext with `NEW_ENCRYPTION_KEY`
3. update the row in the same transaction batch

Tables / columns:

- `profiles.cryptomus_wallet_address`
- every encrypted value stored inside `subscriptions.config`

Keep non-secret operational keys like `recurring_failures` as plain metadata and do not try to decrypt them.

## 4. Switch the runtime key

After the data migration succeeds:

1. update `ENCRYPTION_KEY` in `/opt/agent-market/.env`
2. restart the app container
3. keep the old key stored offline until verification is complete

## 5. Verify

Check all three paths before deleting the old key:

- seller onboarding still shows the saved Cryptomus wallet
- a subscription reconfiguration round-trip still works
- agent deploy still injects decrypted env values into the container

## 6. Rollback

If verification fails:

1. restore the previous database backup
2. restore the old `ENCRYPTION_KEY`
3. restart the app container

Do not attempt partial manual edits against encrypted rows during rollback.
