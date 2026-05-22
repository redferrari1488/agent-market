import type { Metadata } from "next";
import { Geist, Inter, JetBrains_Mono, Manrope, Onest } from "next/font/google";
import { headers } from "next/headers";
import { connection } from "next/server";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

// Geist — основной body/sans-серьезный шрифт. Заменяет Inter
// для дашборда / карточек / форм. Onest остаётся для крупных
// заголовков (hero, h1-h2), JetBrains Mono для CLI/моков.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "cyrillic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  // metadataBase — Next.js использует для resolveURL относительных
  // путей в og:image / twitter:image. Без него apple-icon и
  // opengraph-image ссылаются на http://localhost:3000 в HTML.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://hireon.agency",
  ),
  title: "hireon - Маркетплейс AI-агентов",
  description:
    "Готовые AI-агенты для бизнеса. Выбери, подключи, работает 24/7. Telegram-боты, генерация контента, мониторинг конкурентов и другое.",
};

export const viewport = {
  themeColor: "#0f0e0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  const user = await getUser();

  let role: string | null = null;
  let telegramUsername: string | null = null;
  if (user) {
    const [profile] = await db
      .select({
        role: profiles.role,
        telegramUsername: profiles.telegramUsername,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    role = profile?.role ?? null;
    telegramUsername = profile?.telegramUsername ?? null;
  }

  return (
    <html
      lang="ru"
      className={`dark ${inter.variable} ${geist.variable} ${mono.variable} ${manrope.variable} ${onest.variable}`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider nonce={nonce}>
          <Header
            user={
              user
                ? {
                    email: user.email ?? null,
                    name: user.name ?? null,
                    telegramUsername,
                    id: user.id,
                    role,
                  }
                : null
            }
          />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
