// Чистые помощники для IP-whitelist вебхуков. Вынесены из webhooks/yookassa,
// чтобы покрыть юнит-тестами (T2 аудита 2026-06-10): YooKassa не подписывает
// вебхуки (HMAC нет), IP-whitelist — единственная проверка подлинности, поэтому
// корректность ipInCidr критична для безопасности.

export function normalizeClientIp(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    return trimmed.slice(1, trimmed.indexOf("]"));
  }

  if (trimmed.includes(".") && trimmed.includes(":")) {
    return trimmed.slice(0, trimmed.lastIndexOf(":"));
  }

  return trimmed;
}

export function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const nums = parts.map((part) => Number(part));
  if (nums.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return (
    (((nums[0] << 24) >>> 0) |
      ((nums[1] << 16) >>> 0) |
      ((nums[2] << 8) >>> 0) |
      nums[3]) >>> 0
  );
}

export function expandIpv6(ip: string): string[] | null {
  const normalized = ip.toLowerCase();
  if (normalized.includes(":::")) {
    return null;
  }

  const [left, right] = normalized.split("::");
  const leftParts = left ? left.split(":").filter(Boolean) : [];
  const rightParts = right ? right.split(":").filter(Boolean) : [];

  if (!normalized.includes("::") && leftParts.length !== 8) {
    return null;
  }

  const missing = normalized.includes("::")
    ? 8 - (leftParts.length + rightParts.length)
    : 0;

  if (missing < 0) {
    return null;
  }

  const parts = [
    ...leftParts,
    ...Array.from({ length: missing }, () => "0"),
    ...rightParts,
  ];

  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{0,4}$/.test(part))) {
    return null;
  }

  return parts.map((part) => part.padStart(4, "0"));
}

export function ipv6ToBigInt(ip: string): bigint | null {
  const parts = expandIpv6(ip);
  if (!parts) {
    return null;
  }

  return parts.reduce(
    (acc, part) => (acc << BigInt(16)) + BigInt(parseInt(part, 16)),
    BigInt(0),
  );
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const [range, prefixRaw] = cidr.split("/");
  const prefix = Number(prefixRaw);

  if (ip.includes(":") || range.includes(":")) {
    const ipValue = ipv6ToBigInt(ip);
    const rangeValue = ipv6ToBigInt(range);
    if (ipValue == null || rangeValue == null || !Number.isInteger(prefix) || prefix < 0 || prefix > 128) {
      return false;
    }

    if (prefix === 0) {
      return true;
    }

    const hostBits = BigInt(128) - BigInt(prefix);
    const mask =
      ((BigInt(1) << BigInt(128)) - BigInt(1)) ^
      ((BigInt(1) << hostBits) - BigInt(1));
    return (ipValue & mask) === (rangeValue & mask);
  }

  const ipValue = ipv4ToInt(ip);
  const rangeValue = ipv4ToInt(range);
  if (ipValue == null || rangeValue == null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  if (prefix === 0) {
    return true;
  }

  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipValue & mask) === (rangeValue & mask);
}
