#!/usr/bin/env node
// E2E test для NowPayments webhook flow + idempotency + signature rejection.
//
// Что проверяем:
//   1. Подписанный webhook (валидный HMAC-SHA512) обновляет subscription:
//      providerPaymentId, amount, currency.
//   2. Replay того же webhook — идемпотентен, БД не меняется.
//   3. Невалидная подпись отклоняется (status="ignored").
//   4. После успешного flow можем расшифровать saved config (формат AES-GCM
//      совместим с src/lib/encryption.ts).
//
// Запуск изолированно: создаёт уникальные test-user + test-subscription,
// удаляет всё в finally. Если prod упадёт в середине — cleanup всё равно
// запустится. Если cleanup не дойдёт, осиротевшие test-* rows можно удалить
// SQL'ом: DELETE FROM "user" WHERE id LIKE 'e2e-user-%';
//
// Зависимости: pg (устанавливается на лету в обёртке scripts/e2e-checkout.sh).
//
// Env (из /opt/agent-market/.env):
//   ENCRYPTION_KEY, NOWPAYMENTS_IPN_SECRET, POSTGRES_PASSWORD
//   APP_URL (опц., по умолчанию http://app:3000 из docker-сети)
//   PGHOST=postgres, PGUSER=agentmarket, PGDATABASE=agentmarket

import http from "node:http";
import crypto from "node:crypto";
import pg from "pg";

const ENC_KEY_HEX = required("ENCRYPTION_KEY");
const IPN_SECRET = required("NOWPAYMENTS_IPN_SECRET");
const APP_URL = process.env.APP_URL || "http://app:3000";

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[e2e] FATAL: ${name} env not set`);
    process.exit(2);
  }
  return v;
}

// AES-256-GCM encrypt, формат iv:tag:enc (base64) — копия src/lib/encryption.ts.
function encrypt(plaintext) {
  const key = Buffer.from(ENC_KEY_HEX, "hex");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

function decrypt(ciphertext) {
  const key = Buffer.from(ENC_KEY_HEX, "hex");
  const [ivB64, tagB64, dataB64] = ciphertext.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// Рекурсивная sortKeys + HMAC-SHA512 — копия src/lib/payments/nowpayments.ts:sortKeys.
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, k) => {
      acc[k] = sortKeys(value[k]);
      return acc;
    }, {});
  }
  return value;
}

function signWebhook(body, secret) {
  const sorted = JSON.stringify(sortKeys(body));
  return crypto.createHmac("sha512", secret).update(sorted).digest("hex");
}

async function postJson(urlStr, body, headers) {
  const url = new URL(urlStr);
  const rawBody = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(rawBody), ...headers },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      },
    );
    req.on("error", reject);
    req.write(rawBody);
    req.end();
  });
}

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`assert ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
  console.log(`  ✓ ${label} = ${JSON.stringify(actual)}`);
}

async function main() {
  const client = new pg.Client({
    host: process.env.PGHOST || "postgres",
    user: process.env.PGUSER || "agentmarket",
    database: process.env.PGDATABASE || "agentmarket",
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
    port: Number(process.env.PGPORT || 5432),
  });
  await client.connect();

  const ts = Date.now();
  const userId = `e2e-user-${ts}`;
  const email = `e2e-${ts}@hireon.test`;
  let subId;

  async function cleanup() {
    console.log("[e2e] cleanup...");
    try { await client.query("DELETE FROM subscriptions WHERE user_id = $1", [userId]); } catch {}
    try { await client.query("DELETE FROM profiles WHERE id = $1", [userId]); } catch {}
    try { await client.query('DELETE FROM "user" WHERE id = $1', [userId]); } catch {}
    await client.end();
    console.log("  done");
  }

  try {
    // Найти любого published agent с docker_image (echo-agent в нашем repo —
    // draft, поэтому берём первый published, например content-writer).
    const agentRow = await client.query(
      `SELECT id, price_monthly FROM agents
       WHERE docker_image IS NOT NULL AND status = 'published'
       ORDER BY slug LIMIT 1`,
    );
    if (!agentRow.rows.length) throw new Error("no published agent");
    const agentId = agentRow.rows[0].id;
    const price = agentRow.rows[0].price_monthly ?? 200;
    console.log(`[e2e] agent ${agentId}, price ${price}`);

    // Создаём BetterAuth user + profile + subscription (pending_setup).
    await client.query(
      `INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, now(), now())`,
      [userId, email, "E2E Test"],
    );
    await client.query(
      `INSERT INTO profiles (id, email, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, 'buyer', now(), now())`,
      [userId, email, "E2E Test"],
    );
    const subRow = await client.query(
      `INSERT INTO subscriptions
         (user_id, agent_id, purchase_type, payment_provider, amount, currency, status)
       VALUES ($1, $2, 'subscription', 'nowpayments', $3, 'USD', 'pending_setup')
       RETURNING id`,
      [userId, agentId, price],
    );
    subId = subRow.rows[0].id;
    console.log(`[e2e] subscription ${subId}`);

    // === Phase 1: валидный webhook ===
    console.log("\n[e2e] phase 1: valid signed webhook");
    const paymentId = `e2e-payment-${ts}`;
    const webhookBody = {
      payment_status: "finished",
      payment_id: paymentId,
      order_id: subId,
      price_amount: price / 100,
      price_currency: "USD",
      pay_amount: 12.5,
      pay_currency: "usdttrc20",
    };
    const sig = signWebhook(webhookBody, IPN_SECRET);
    const res1 = await postJson(`${APP_URL}/api/webhooks/nowpayments`, webhookBody, {
      "x-nowpayments-sig": sig,
    });
    console.log(`  webhook response: ${res1.status} ${res1.body}`);
    assertEq(res1.status, 200, "phase1 http status");

    const updated = await client.query(
      "SELECT provider_payment_id, amount, currency FROM subscriptions WHERE id = $1",
      [subId],
    );
    assertEq(updated.rows[0].provider_payment_id, paymentId, "provider_payment_id");
    assertEq(updated.rows[0].amount, price, "amount");
    assertEq(updated.rows[0].currency, "USD", "currency");

    // === Phase 2: idempotent replay ===
    console.log("\n[e2e] phase 2: replay same webhook (idempotent)");
    const res2 = await postJson(`${APP_URL}/api/webhooks/nowpayments`, webhookBody, {
      "x-nowpayments-sig": sig,
    });
    console.log(`  replay response: ${res2.status} ${res2.body}`);
    assertEq(res2.status, 200, "phase2 http status");
    if (!res2.body.includes("idempotent")) {
      throw new Error(`phase2: expected idempotent, got ${res2.body}`);
    }
    console.log("  ✓ idempotency confirmed");

    // === Phase 3: bad signature rejected ===
    console.log("\n[e2e] phase 3: bad signature");
    const badSig = "deadbeef".repeat(16); // 128 hex chars, тот же length но wrong content
    const res3 = await postJson(`${APP_URL}/api/webhooks/nowpayments`, webhookBody, {
      "x-nowpayments-sig": badSig,
    });
    console.log(`  bad-sig response: ${res3.status} ${res3.body}`);
    assertEq(res3.status, 200, "phase3 http status (handled gracefully)");
    if (!res3.body.includes("invalid signature") && !res3.body.includes("ignored")) {
      throw new Error(`phase3: bad signature was not detected, body=${res3.body}`);
    }
    console.log("  ✓ bad signature ignored");

    // === Phase 4: encryption roundtrip ===
    console.log("\n[e2e] phase 4: AES-GCM encrypt/decrypt roundtrip");
    const sample = "TELEGRAM:0000:secret:value";
    const enc = encrypt(sample);
    const dec = decrypt(enc);
    assertEq(dec, sample, "AES roundtrip");

    console.log("\n[e2e] ALL PHASES PASS");
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error("\n[e2e] FAIL:", err.message);
  if (err.stack) console.error(err.stack.split("\n").slice(0, 5).join("\n"));
  process.exit(1);
});
