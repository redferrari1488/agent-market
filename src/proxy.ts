import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // BetterAuth хранит сессию в cookie "better-auth.session_token"
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // Защищённые маршруты — требуют авторизации
  const protectedPaths = ["/dashboard", "/seller", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Проверка ролей делается в server components/API routes через getUser() + db query
  // Middleware только проверяет наличие сессии для быстрого редиректа

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/seller/:path*", "/admin/:path*"],
};
