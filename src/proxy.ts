import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const protectedPaths = ["/dashboard", "/seller", "/admin"];

const telegramWidgetPaths = new Set(["/auth/login"]);

const rateLimits: Array<{ match: (p: string) => boolean; limit: number; windowMs: number }> = [
  { match: (p) => p.startsWith("/api/auth/"), limit: 10, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/checkout"), limit: 5, windowMs: 60_000 },
  { match: (p) => p.startsWith("/api/seller/onboarding"), limit: 3, windowMs: 60_000 },
];

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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
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

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildCsp(nonce, pathname);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);

    const response = NextResponse.redirect(url);
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
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
