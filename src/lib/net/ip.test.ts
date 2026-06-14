import { describe, expect, it } from "vitest";
import { ipInCidr, normalizeClientIp } from "./ip";

// YooKassa не подписывает вебхуки — IP-whitelist единственная защита. Любая
// дыра в ipInCidr = webhook forgery, поэтому покрываем плотно.

describe("ipInCidr — IPv4", () => {
  it("матчит адрес внутри диапазона", () => {
    expect(ipInCidr("185.71.76.10", "185.71.76.0/27")).toBe(true);
    expect(ipInCidr("185.71.76.0", "185.71.76.0/27")).toBe(true);
    expect(ipInCidr("185.71.76.31", "185.71.76.0/27")).toBe(true);
  });

  it("отвергает адрес вне диапазона (за границей префикса)", () => {
    expect(ipInCidr("185.71.76.32", "185.71.76.0/27")).toBe(false);
    expect(ipInCidr("185.71.77.10", "185.71.76.0/27")).toBe(false);
    expect(ipInCidr("8.8.8.8", "185.71.76.0/27")).toBe(false);
  });

  it("/32 — точное совпадение", () => {
    expect(ipInCidr("77.75.156.11", "77.75.156.11/32")).toBe(true);
    expect(ipInCidr("77.75.156.12", "77.75.156.11/32")).toBe(false);
  });

  it("/0 матчит всё", () => {
    expect(ipInCidr("1.2.3.4", "0.0.0.0/0")).toBe(true);
  });

  it("мусорный/спуфнутый ввод → false, без исключения", () => {
    expect(ipInCidr("notanip", "185.71.76.0/27")).toBe(false);
    expect(ipInCidr("", "185.71.76.0/27")).toBe(false);
    expect(ipInCidr("999.999.999.999", "185.71.76.0/27")).toBe(false);
    expect(ipInCidr("1.2.3", "185.71.76.0/27")).toBe(false);
    expect(ipInCidr("1.2.3.4.5", "185.71.76.0/27")).toBe(false);
  });
});

describe("ipInCidr — IPv6", () => {
  it("матчит внутри диапазона", () => {
    expect(ipInCidr("2a02:5180::1", "2a02:5180::/32")).toBe(true);
    expect(ipInCidr("2a02:5180:ffff::1", "2a02:5180::/32")).toBe(true);
  });

  it("отвергает вне диапазона", () => {
    expect(ipInCidr("2a03:5180::1", "2a02:5180::/32")).toBe(false);
    expect(ipInCidr("2a02:5181::1", "2a02:5180::/16")).toBe(true); // /16 шире
    expect(ipInCidr("2b02:5180::1", "2a02:5180::/32")).toBe(false);
  });

  it("кривой IPv6 → false", () => {
    expect(ipInCidr("2a02:::5180", "2a02:5180::/32")).toBe(false);
    expect(ipInCidr("xyz", "2a02:5180::/32")).toBe(false);
  });
});

describe("normalizeClientIp", () => {
  it("снимает порт с IPv4", () => {
    expect(normalizeClientIp("1.2.3.4:8080")).toBe("1.2.3.4");
  });

  it("снимает скобки и порт с IPv6", () => {
    expect(normalizeClientIp("[2a02:5180::1]:443")).toBe("2a02:5180::1");
  });

  it("оставляет голый адрес как есть, тримит пробелы", () => {
    expect(normalizeClientIp("1.2.3.4")).toBe("1.2.3.4");
    expect(normalizeClientIp("  1.2.3.4  ")).toBe("1.2.3.4");
    expect(normalizeClientIp("2a02:5180::1")).toBe("2a02:5180::1");
  });
});
