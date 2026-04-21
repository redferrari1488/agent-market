type Bucket = { times: number[] };

const buckets = new Map<string, Bucket>();
let opCounter = 0;

export type RateLimitConfig = { limit: number; windowMs: number };

function maybeCleanup() {
  if (++opCounter % 1000 !== 0) return;
  const now = Date.now();
  const maxAge = 10 * 60 * 1000;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.times.length === 0 || bucket.times[bucket.times.length - 1] < now - maxAge) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(key: string, cfg: RateLimitConfig) {
  maybeCleanup();
  const now = Date.now();
  const cutoff = now - cfg.windowMs;
  const bucket = buckets.get(key) ?? { times: [] };
  bucket.times = bucket.times.filter((t) => t > cutoff);
  if (bucket.times.length >= cfg.limit) {
    buckets.set(key, bucket);
    const retryAfter = Math.max(
      1,
      Math.ceil((bucket.times[0] + cfg.windowMs - now) / 1000),
    );
    return { ok: false as const, retryAfter };
  }
  bucket.times.push(now);
  buckets.set(key, bucket);
  return { ok: true as const, retryAfter: 0 };
}

export function getClientIp(headers: Headers) {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
