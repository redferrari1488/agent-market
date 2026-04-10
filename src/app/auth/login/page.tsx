import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import Link from "next/link";
import { Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "Вход — AgentMarket",
  description: "Войдите в AgentMarket через Telegram, Google, GitHub или email.",
};

export default function LoginPage() {
  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/30">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">AgentMarket</span>
        </Link>

        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight">
              Войти или{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                зарегистрироваться
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Выберите удобный способ входа
            </p>

            {telegramBot && (
              <div className="mt-6">
                <TelegramLoginButton botUsername={telegramBot} />
              </div>
            )}

            <div className="mt-4">
              <OAuthButtons />
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                или по email
              </span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
