import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { connection } from "next/server";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PaletteSwitcher } from "@/components/dev/PaletteSwitcher";
import { getUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "hireon - Маркетплейс AI-агентов",
  description:
    "Готовые AI-агенты для бизнеса. Выбери, подключи, работает 24/7. Telegram-боты, генерация контента, мониторинг конкурентов и другое.",
};

export const viewport = {
  themeColor: "#04060d",
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
      className={`dark ${inter.variable} ${mono.variable}`}
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
          {process.env.NODE_ENV === "development" && <PaletteSwitcher />}
        </ThemeProvider>
      </body>
    </html>
  );
}
