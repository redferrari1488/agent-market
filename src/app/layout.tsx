import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getUser } from "@/lib/auth-server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "AgentMarket — Маркетплейс AI-агентов",
  description:
    "Готовые AI-агенты для бизнеса. Выбери, подключи, работает 24/7. Telegram-боты, генерация контента, мониторинг конкурентов и другое.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider>
          <Header
            user={
              user
                ? { email: user.email ?? null, id: user.id }
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
