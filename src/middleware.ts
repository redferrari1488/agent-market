import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getTrustedOrigins } from "@/lib/trusted-origins";

const protectedPaths = ["/dashboard", "/seller", "/admin"];

const telegramWidgetPaths = new Set(["/auth/login"]);

const rateLimits: Array<{ match: (p: string) => boolean; limit: number; windowMs: number }> = [
  { match: (p) => p.startsWith("/api/auth/"), limit: 10, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/checkout"), limit: 5, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/seller/onboarding"), limit: 3, windowMs: 60_000 },
];

// CSRF guard: для mutating API-запросов требуем Origin/Referer того же
// origin что NEXT_PUBLIC_APP_URL. BetterAuth-кука sameSite=lax не блокирует
// cross-site form-POST, поэтому проверяем явно.
//
// Исключения (приходят без Origin или от внешних систем):
//   - /api/webhooks/* — YooKassa/NowPayments по IP-whitelist/HMAC
//   - /api/auth/*     — BetterAuth handles its own CSRF via state/cookie
//   - /api/cron/*     — внешний планировщик с x-cron-secret
const CSRF_EXEMPT_PREFIXES = ["/api/webhooks/", "/api/auth/", "/api/cron/"];
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isCsrfOriginAllowed(request: NextRequest): boolean {
  const trustedOrigins = getTrustedOrigins();
  if (trustedOrigins.length === 0) return true; // dev без NEXT_PUBLIC_APP_URL

  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  if (!origin) return false;

  let incoming: URL;
  try {
    incoming = new URL(origin);
  } catch {
    return false;
  }

  return trustedOrigins.some((trusted) => {
    try {
      const expected = new URL(trusted);
      return incoming.host === expected.host && incoming.protocol === expected.protocol;
    } catch {
      return false;
    }
  });
}

function buildCsp(nonce: string, pathname: string) {
  const isDev = process.env.NODE_ENV === "development";
  const allowTelegramWidget = telegramWidgetPaths.has(pathname);

  const scriptSrc = allowTelegramWidget
    ? `script-src 'self' 'nonce-${nonce}' https://telegram.org https://oauth.telegram.org${isDev ? " 'unsafe-eval'" : ""}`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://telegram.org https://oauth.telegram.org${isDev ? " 'unsafe-eval'" : ""}`;

  return `
    default-src 'self';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    object-src 'none';
    ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' https://telegram.org https://oauth.telegram.org;
    frame-src 'self' https://telegram.org https://oauth.telegram.org;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    // CSRF Origin-check для mutating запросов. Раньше — single защитой был
    // sameSite=lax на cookie, но он не блокирует cross-site form-POST.
    if (
      MUTATING_METHODS.has(request.method) &&
      !CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
      !isCsrfOriginAllowed(request)
    ) {
      return NextResponse.json(
        { error: "Forbidden origin", code: 403 },
        { status: 403 },
      );
    }

    const rl = rateLimits.find((r) => r.match(pathname));
    if (rl) {
      const ip = getClientIp(request.headers);
      const result = checkRateLimit(`${pathname}:${ip}`, { limit: rl.limit, windowMs: rl.windowMs });
      if (!result.ok) {
        return new NextResponse(
          JSON.stringify({ error: "Слишком много запросов. Подождите немного.", retryAfter: result.retryAfter }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(result.retryAfter),
            },
          },
        );
      }
    }
    return NextResponse.next();
  }

  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildCsp(nonce, pathname);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  // В dev не выставляем CSP — Turbopack генерирует свои nonce независимо от
  // proxy.ts, из-за чего CSS/скрипты блокируются. На проде CSP работает.
  if (!isDev) {
    requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isProtected = protectedPaths.some((p) => {
    // /seller сам по себе — публичная витрина «стать продавцом»; защищаем
    // только под-пути (/seller/agents/new, /seller/onboarding и т.д.) —
    // там уже стоит свой redirect в page.tsx.
    if (p === "/seller") return pathname.startsWith("/seller/");
    return pathname.startsWith(p);
  });

  if (isProtected && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);

    const response = NextResponse.redirect(url);
    if (!isDev) {
      response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    }
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  if (!isDev) {
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
