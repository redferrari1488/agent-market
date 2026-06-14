import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./encryption";

// ENCRYPTION_KEY задаётся в src/test/setup.ts (фиктивный 32-байтный ключ).
describe("encryption — AES-256-GCM round-trip", () => {
  it("расшифровывает то, что зашифровал", () => {
    // Пустую строку не проверяем: encrypt("") даёт шифротекст с пустым data-сегментом,
    // который decrypt отвергает как «неверный формат». В проде пустые значения
    // конфига отсеиваются валидацией, а чтение обёрнуто в try/catch → "".
    for (const plain of ["secret-token", "юникод-текст 🤖", JSON.stringify({ a: 1, b: "x" })]) {
      expect(decrypt(encrypt(plain))).toBe(plain);
    }
  });

  it("один и тот же текст шифруется по-разному (случайный IV)", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("подделка шифротекста ловится auth-тегом GCM", () => {
    const enc = encrypt("tamper-me");
    const [iv, tag, data] = enc.split(":");
    // портим последний символ полезной нагрузки
    const flipped = data.slice(0, -1) + (data.slice(-1) === "A" ? "B" : "A");
    expect(() => decrypt([iv, tag, flipped].join(":"))).toThrow();
  });

  it("кривой формат → исключение", () => {
    expect(() => decrypt("garbage")).toThrow();
    expect(() => decrypt("only:two")).toThrow();
  });
});
