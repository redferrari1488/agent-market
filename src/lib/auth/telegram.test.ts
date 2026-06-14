import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyTelegramAuth, type TelegramAuthData } from "./telegram";

const BOT_TOKEN = "123456:test-bot-token";

// Подписываем данные тем же алгоритмом, что и Telegram, чтобы проверить verify.
function sign(fields: Omit<TelegramAuthData, "hash">): string {
  const dataCheckString = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  return crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
}

function freshData(): TelegramAuthData {
  const base = {
    id: 42,
    first_name: "Ada",
    username: "ada",
    auth_date: Math.floor(Date.now() / 1000),
  };
  return { ...base, hash: sign(base) };
}

describe("verifyTelegramAuth", () => {
  it("принимает валидную свежую подпись", () => {
    expect(verifyTelegramAuth(freshData(), BOT_TOKEN)).toEqual({ ok: true });
  });

  it("отвергает подделанное поле (id поменян после подписи)", () => {
    const d = freshData();
    const tampered = { ...d, id: 999 };
    expect(verifyTelegramAuth(tampered, BOT_TOKEN)).toEqual({
      ok: false,
      reason: "неверная подпись",
    });
  });

  it("отвергает чужой токен", () => {
    expect(verifyTelegramAuth(freshData(), "other-token").ok).toBe(false);
  });

  it("отвергает устаревший auth_date (replay)", () => {
    const base = {
      id: 42,
      first_name: "Ada",
      username: "ada",
      auth_date: Math.floor(Date.now() / 1000) - 120,
    };
    const stale: TelegramAuthData = { ...base, hash: sign(base) };
    expect(verifyTelegramAuth(stale, BOT_TOKEN)).toEqual({
      ok: false,
      reason: "auth_date устарел",
    });
  });

  it("отвергает пустой hash", () => {
    const d = freshData();
    expect(verifyTelegramAuth({ ...d, hash: "" }, BOT_TOKEN).ok).toBe(false);
  });
});
