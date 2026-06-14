import { describe, expect, it } from "vitest";
import { validateConfigAgainstSchema, type SetupField } from "./agent-config-validation";

const tokenField: SetupField = { key: "TOKEN", label: "Токен", type: "text" };

// H3 аудита: покупатель не должен мочь подсунуть env вне setup_schema
// (AI_MODEL/AI_PROVIDER поверх платформенного ключа, перетирание seller-env).
describe("validateConfigAgainstSchema — whitelist (H3)", () => {
  it("пропускает ровно schema-ключи", () => {
    expect(validateConfigAgainstSchema([tokenField], { TOKEN: "abc" })).toEqual({ ok: true });
  });

  it("отвергает неизвестный ключ (инжект env)", () => {
    const res = validateConfigAgainstSchema([tokenField], { TOKEN: "abc", AI_MODEL: "anthropic/claude-opus" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.invalid.join(" ")).toContain("AI_MODEL");
  });

  it("отвергает посторонние ключи даже при пустой схеме", () => {
    const res = validateConfigAgainstSchema([], { FOO: "bar" });
    expect(res.ok).toBe(false);
    expect(validateConfigAgainstSchema([], {})).toEqual({ ok: true });
  });

  it("разрешает служебные ключи платформы (_meta_ / legacy)", () => {
    const res = validateConfigAgainstSchema([tokenField], {
      TOKEN: "abc",
      _meta_recurring_failures: "0",
      recurring_failures: "2",
    });
    expect(res).toEqual({ ok: true });
  });

  it("ловит пропущенное required-поле", () => {
    const res = validateConfigAgainstSchema([tokenField], {});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.missing).toContain("Токен");
  });

  it("required:false не считается пропущенным", () => {
    const opt: SetupField = { key: "OPT", label: "Опц", type: "text", required: false };
    expect(validateConfigAgainstSchema([opt], {})).toEqual({ ok: true });
  });

  it("валидирует select по options", () => {
    const mode: SetupField = { key: "MODE", label: "Режим", type: "select", options: ["a", "b"] };
    expect(validateConfigAgainstSchema([mode], { MODE: "a" })).toEqual({ ok: true });
    expect(validateConfigAgainstSchema([mode], { MODE: "c" }).ok).toBe(false);
  });

  it("валидирует json_array", () => {
    const items: SetupField = { key: "ITEMS", label: "Список", type: "json_array" };
    expect(validateConfigAgainstSchema([items], { ITEMS: '["a","b"]' })).toEqual({ ok: true });
    expect(validateConfigAgainstSchema([items], { ITEMS: "not-json" }).ok).toBe(false);
    expect(validateConfigAgainstSchema([items], { ITEMS: "[]" }).ok).toBe(false);
  });
});
