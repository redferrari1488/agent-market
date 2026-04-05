import { LoginForm } from "./LoginForm";
import Link from "next/link";
import { Bot } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">AgentMarket</span>
      </Link>

      <div className="w-full rounded-2xl border border-border p-6 sm:p-8">
        <h1 className="text-xl font-bold">Войти или зарегистрироваться</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Введите email — отправим код для входа
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
