import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { LoginSocialRow } from "@/components/auth/LoginSocialRow";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Вход - hireon",
  description: "Войдите в hireon через Telegram, Google или GitHub.",
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
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const isMobile =
    /(android|iphone|ipad|ipod|mobile|webos)/i.test(requestHeaders.get("user-agent") ?? "");
  const telegramAvailable = Boolean(telegramBot && telegramBotId);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} />
          <span className={styles.brandName}>hireon</span>
        </Link>
        <span className={styles.route}>auth / login</span>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.head}>
            <div className={styles.dim} aria-hidden="true">
              <span className={styles.dimArrow}>|◂</span>
              <span className={styles.dimLine} />
              <span>session · v1</span>
              <span className={styles.dimLine} />
              <span className={styles.dimArrow}>▸|</span>
            </div>
            <h1 className={styles.h1}>вход в кабинет</h1>
            <p className={styles.sub}>Управляйте своими AI-агентами.</p>
          </div>

          <LoginSocialRow
            telegramBotId={telegramAvailable ? telegramBotId : undefined}
            telegramFallbackUrl={telegramFallbackUrl}
            isMobile={isMobile}
            nonce={nonce}
            google={googleEnabled}
            github={githubEnabled}
          />

          <div className={styles.foot}>
            продолжая, вы соглашаетесь с{" "}
            <Link href="/terms">условиями</Link> и{" "}
            <Link href="/privacy">политикой</Link>
          </div>
        </div>
      </main>

      <footer className={styles.bottom}>
        <div className={styles.bottomLeft}>
          <span className={styles.statusDot} />
          <span>все системы в норме</span>
        </div>
        <div className={styles.bottomRight}>
          <Link href="/terms">terms</Link>
          <Link href="/privacy">privacy</Link>
        </div>
      </footer>
    </div>
  );
}
