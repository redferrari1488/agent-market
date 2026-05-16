import { NextResponse } from "next/server";

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
  // ВАЖНО: на проде trust только x-real-ip от nginx (внутри docker-сети).
  // x-forwarded-for от внешних клиентов спуфится тривиально. Nginx ставит
  // X-Real-IP $remote_addr, и т.к. app слушает 127.0.0.1:3000, заголовок
  // приходит только из доверенного nginx-контейнера.
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return "unknown";
}

// Стандартные конфиги для критичных endpoint'ов. Строже чем nginx-зоны
// в infra/nginx/nginx.conf — application-layer задумано как первичный
// gate (per-user), nginx как fallback (per-IP).
export const RATE_LIMITS = {
  checkout: { limit: 5, windowMs: 60_000 },
  sellerBecome: { limit: 3, windowMs: 60 * 60_000 },
  accountDelete: { limit: 3, windowMs: 60 * 60_000 },
} as const;

/**
 * Применяет rate-limit и возвращает 429-ответ если лимит превышен.
 * Иначе возвращает null — handler продолжает обычным путём.
 */
export function applyRateLimit(
  routeKey: string,
  identity: string,
  cfg: RateLimitConfig,
): NextResponse | null {
  const result = checkRateLimit(`${routeKey}:${identity}`, cfg);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Слишком много запросов. Попробуйте позже.", code: 429 },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    },
  );
}
