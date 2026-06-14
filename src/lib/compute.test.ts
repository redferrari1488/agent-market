import { describe, expect, it } from "vitest";
import {
  PLATFORM_COMMISSION,
  SELLER_SHARE,
  platformCommission,
  sellerPayout,
} from "./compute";

// Phase 0: бесплатное размещение, комиссия 0%, продавцу 100% его цены.
// Если кто-то случайно поменяет модель — тесты должны об этом сказать.
describe("compute — модель выплат Phase 0", () => {
  it("sellerPayout = 100% цены продавца", () => {
    expect(sellerPayout(39_000)).toBe(39_000);
    expect(sellerPayout(0)).toBe(0);
    expect(sellerPayout(150_000)).toBe(150_000);
  });

  it("platformCommission = 0 при любой цене", () => {
    expect(platformCommission(39_000)).toBe(0);
    expect(platformCommission(0)).toBe(0);
  });

  it("константы зафиксированы на Phase 0", () => {
    expect(PLATFORM_COMMISSION).toBe(0);
    expect(SELLER_SHARE).toBe(1);
  });
});
