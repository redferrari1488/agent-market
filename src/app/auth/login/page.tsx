import { LoginForm } from "./LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import Link from "next/link";
import { Bot } from "lucide-react";

export default function LoginPage() {
  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">AgentMarket</span>
      </Link>

      <div className="w-full rounded-2xl border border-border p-6 sm:p-8">
        <h1 className="text-xl font-bold">Войти или зарегистрироваться</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Выбери удобный способ
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
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            или по email
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
