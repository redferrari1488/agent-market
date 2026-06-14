import { describe, expect, it } from "vitest";
import {
  EXPIRY_GRACE_DAYS,
  shouldMarkExpired,
  shouldStopContainer,
} from "./reconcile";

const now = new Date("2026-06-14T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

describe("shouldMarkExpired", () => {
  it("active с истёкшим > grace сроком → expired", () => {
    expect(shouldMarkExpired({ status: "active", expiresAt: daysAgo(EXPIRY_GRACE_DAYS + 1), containerId: "c" }, now)).toBe(true);
  });

  it("active в пределах grace → не трогаем (recurring ещё может продлить)", () => {
    expect(shouldMarkExpired({ status: "active", expiresAt: daysAgo(1), containerId: "c" }, now)).toBe(false);
  });

  it("active без expiresAt (one_time) → не expired", () => {
    expect(shouldMarkExpired({ status: "active", expiresAt: null, containerId: "c" }, now)).toBe(false);
  });

  it("не-active подписки не трогаем этой фазой", () => {
    expect(shouldMarkExpired({ status: "paused", expiresAt: daysAgo(30), containerId: "c" }, now)).toBe(false);
  });

  it("grace=0 → истёк ровно сейчас уже expired", () => {
    expect(shouldMarkExpired({ status: "active", expiresAt: daysAgo(0.001), containerId: "c" }, now, 0)).toBe(true);
  });
});

describe("shouldStopContainer", () => {
  it("paused/expired/cancelled с контейнером → стоп (H1)", () => {
    for (const status of ["paused", "expired", "cancelled"]) {
      expect(shouldStopContainer({ status, expiresAt: null, containerId: "c" })).toBe(true);
    }
  });

  it("active не трогаем", () => {
    expect(shouldStopContainer({ status: "active", expiresAt: null, containerId: "c" })).toBe(false);
  });

  it("нет контейнера — нечего стопить", () => {
    expect(shouldStopContainer({ status: "paused", expiresAt: null, containerId: null })).toBe(false);
  });

  it("pending_setup не трогаем", () => {
    expect(shouldStopContainer({ status: "pending_setup", expiresAt: null, containerId: "c" })).toBe(false);
  });
});
