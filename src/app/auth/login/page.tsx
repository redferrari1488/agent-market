import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Вход - AgentMarket",
  description: "Войдите в AgentMarket через Telegram, Google, GitHub или email.",
};

export default function LoginPage() {
  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-baseline justify-center gap-0">
          <span className="text-[15px] font-bold tracking-[-0.02em]">agent</span>
          <span className="font-mono text-[15px] font-bold tracking-[-0.02em] text-muted-foreground">market</span>
        </Link>

        <div className="rounded-lg border border-border/40 p-6 sm:p-8">
          <h1 className="text-[1.5rem] font-bold tracking-[-0.02em]">
            Войти или зарегистрироваться
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
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
            <div className="h-px flex-1 bg-border/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              или по email
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
