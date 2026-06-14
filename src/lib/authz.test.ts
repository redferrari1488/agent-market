import { describe, expect, it } from "vitest";
import { isRoleAllowed } from "./authz";

describe("isRoleAllowed", () => {
  it("пропускает разрешённую роль", () => {
    expect(isRoleAllowed("admin", ["admin"])).toBe(true);
    expect(isRoleAllowed("seller", ["seller", "admin"])).toBe(true);
    expect(isRoleAllowed("admin", ["seller", "admin"])).toBe(true);
  });

  it("отвергает чужую роль", () => {
    expect(isRoleAllowed("seller", ["admin"])).toBe(false);
    expect(isRoleAllowed("buyer", ["seller", "admin"])).toBe(false);
  });

  it("отвергает отсутствие профиля/роли", () => {
    expect(isRoleAllowed(undefined, ["admin"])).toBe(false);
    expect(isRoleAllowed(null, ["admin"])).toBe(false);
    expect(isRoleAllowed("", ["admin"])).toBe(false);
  });
});
