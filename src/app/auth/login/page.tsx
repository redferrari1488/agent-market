import type { Metadata } from "next";
import { headers } from "next/headers";
import { LoginForm } from "./LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { Zap, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Вход - Hireon",
  description: "Войдите в Hireon через Telegram, Google, GitHub или email.",
};

const highlights = [
  {
    icon: Zap,
    title: "Подключение за минуту",
    desc: "Выбрали агента - пошагово заполнили настройки - готово.",
  },
  {
    icon: ShieldCheck,
    title: "Ваши ключи зашифрованы",
    desc: "AES-256-GCM. Расшифровка только при запуске агента.",
  },
  {
    icon: Clock,
    title: "Работает 24/7",
    desc: "Агент в изолированной среде, автоперезапуск при сбоях.",
  },
];

export default async function LoginPage() {
  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const githubEnabled = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  const oauthAvailable = googleEnabled || githubEnabled;
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6">
      <div className="grid min-h-[calc(100vh-56px-1px)] items-center gap-8 py-6 sm:gap-12 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
        {/* Left — copy */}
        <div className="hidden lg:block">
          <Link
            href="/"
            className="inline-flex items-baseline gap-0 transition-opacity hover:opacity-80"
          >
            <span className="text-[15px] font-bold tracking-[-0.02em]">hireon</span>
            <span className="font-mono text-[15px] font-bold tracking-[-0.02em] text-muted-foreground">
              .agency
            </span>
          </Link>

          <p className="mt-10 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Вход
          </p>
          <h1 className="mt-3 text-[2.5rem] font-bold leading-[1.05] tracking-[-0.03em] lg:text-[3rem]">
            Маркетплейс
            <br />
            <span className="text-muted-foreground">рабочих агентов.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Готовые AI-агенты для бизнеса. Выбирайте, настраивайте,
            запускайте - работает 24/7 без вашего участия.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map((h) => (
              <li key={h.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40">
                  <h.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold tracking-tight">
                    {h.title}
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {h.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <Link
            href="/"
            className="mb-8 flex items-baseline justify-center gap-0 lg:hidden"
          >
            <span className="text-[15px] font-bold tracking-[-0.02em]">hireon</span>
            <span className="font-mono text-[15px] font-bold tracking-[-0.02em] text-muted-foreground">
              .agency
            </span>
          </Link>

          <div className="rounded-lg border border-border/40 p-6 sm:p-8">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Вход
              </p>
              <h2 className="mt-2 text-[1.5rem] font-bold tracking-[-0.02em] sm:text-[1.75rem]">
                Войти или зарегистрироваться
              </h2>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Выберите удобный способ. Регистрация занимает 10 секунд.
              </p>
            </div>

            {telegramBot && (
              <div className="mt-6">
                <TelegramLoginButton botUsername={telegramBot} nonce={nonce} />
              </div>
            )}

            {oauthAvailable && (
              <div className="mt-4">
                <OAuthButtons google={googleEnabled} github={githubEnabled} />
              </div>
            )}

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/40" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                или по email
              </span>
              <div className="h-px flex-1 bg-border/40" />
            </div>

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
        </div>
      </div>
    </section>
  );
}
