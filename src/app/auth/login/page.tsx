import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";

export const metadata: Metadata = {
  title: "Вход - Hireon",
  description: "Войдите в Hireon через Telegram, Google, GitHub или email.",
};

function buildTelegramFallbackUrl(botId: string | undefined) {
  if (!botId) return undefined;

  const rawAppUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  try {
    const origin = new URL(rawAppUrl).origin;
    const returnTo = new URL("/auth/telegram-callback", origin);
    const authUrl = new URL("https://oauth.telegram.org/auth");

    authUrl.searchParams.set("bot_id", botId);
    authUrl.searchParams.set("origin", origin);
    authUrl.searchParams.set("return_to", returnTo.toString());
    authUrl.searchParams.set("request_access", "write");

    return authUrl.toString();
  } catch {
    return undefined;
  }
}

export default async function LoginPage() {
  const requestHeaders = await headers();
  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const telegramBotId = process.env.TELEGRAM_BOT_TOKEN?.split(":")[0]?.trim();
  const telegramFallbackUrl = buildTelegramFallbackUrl(telegramBotId);
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const githubEnabled = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  const oauthAvailable = googleEnabled || githubEnabled;
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const isMobile =
    /(android|iphone|ipad|ipod|mobile|webos)/i.test(requestHeaders.get("user-agent") ?? "");
  const telegramAvailable = Boolean(telegramBot && telegramBotId);
  const hasSocial = telegramAvailable || oauthAvailable;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px-1px)] w-full max-w-md flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-10 flex items-baseline gap-0 transition-opacity hover:opacity-80"
      >
        <span className="text-[16px] font-bold tracking-[-0.02em]">hireon</span>
        <span className="font-mono text-[16px] font-bold tracking-[-0.02em] text-muted-foreground">
          .agency
        </span>
      </Link>

      <div className="w-full rounded-lg border border-border/40 p-6 sm:p-8">
        {hasSocial && (
          <div className="flex items-center justify-center gap-3">
            {telegramAvailable && (
              <TelegramLoginButton
                botId={telegramBotId}
                nonce={nonce}
                fallbackUrl={telegramFallbackUrl}
                isMobile={isMobile}
              />
            )}
            <OAuthButtons google={googleEnabled} github={githubEnabled} />
          </div>
        )}

        {hasSocial && (
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              или email
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>
        )}

        <LoginForm />
      </div>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground/60">
        Продолжая, вы соглашаетесь с{" "}
        <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
          условиями
        </Link>{" "}
        и{" "}
        <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
          политикой конфиденциальности
        </Link>
        .
      </p>
    </section>
  );
}
