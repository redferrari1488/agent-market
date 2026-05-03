import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { account, profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { isSyntheticTelegramEmail } from "@/lib/account-deletion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настройки аккаунта - hireon",
  description: "Управление профилем.",
};

const providerLabel: Record<string, string> = {
  credential: "Email и пароль",
  google: "Google",
  github: "GitHub",
};

export default async function DashboardSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const [profile] = await db
    .select({
      email: profiles.email,
      telegramUsername: profiles.telegramUsername,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const linkedAccounts = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, user.id));

  const profileEmail = profile?.email ?? user.email ?? null;
  const showEmail =
    !!profileEmail && !isSyntheticTelegramEmail(profileEmail);
  const oauthProviders = linkedAccounts
    .map((row) => row.providerId)
    .filter((providerId) => providerId !== "credential");

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Дашборд
        </Link>

        <div className="mt-6">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Настройки
          </p>
          <h1 className="mt-2 text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
            Аккаунт
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Управление профилем.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Профиль
          </h2>
          <dl className="mt-4 grid gap-3 rounded-lg border border-border/40 p-5 text-[13px]">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
              <dt className="w-32 shrink-0 text-muted-foreground">Email</dt>
              <dd className="text-foreground/90 break-all">
                {showEmail ? profileEmail : "—"}
              </dd>
            </div>
            {profile?.telegramUsername && (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
                <dt className="w-32 shrink-0 text-muted-foreground">Telegram</dt>
                <dd className="text-foreground/90">@{profile.telegramUsername}</dd>
              </div>
            )}
            {oauthProviders.length > 0 && (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
                <dt className="w-32 shrink-0 text-muted-foreground">Вход через</dt>
                <dd className="text-foreground/90">
                  {oauthProviders
                    .map((p) => providerLabel[p] ?? p)
                    .join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
