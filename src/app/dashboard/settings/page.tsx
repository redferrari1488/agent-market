import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound, Shield, UserRound } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, profiles } from "@/lib/db/schema";
import {
  isSyntheticTelegramEmail,
  requiresPasswordDeleteReauth,
} from "@/lib/account-deletion";
import { getUser } from "@/lib/auth-server";
import { DeleteAccountCard } from "@/components/dashboard/DeleteAccountCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настройки аккаунта - Hireon",
  description: "Управление входом, безопасностью и удалением аккаунта.",
};

const providerLabel: Record<string, string> = {
  credential: "Email и пароль",
  google: "Google",
  github: "GitHub",
};

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export default async function DashboardSettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  const [profile] = await db
    .select({
      email: profiles.email,
      name: profiles.name,
      telegramId: profiles.telegramId,
      telegramUsername: profiles.telegramUsername,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const linkedAccounts = await db
    .select({ providerId: account.providerId, password: account.password })
    .from(account)
    .where(eq(account.userId, user.id));

  const deleteEmail = profile?.email ?? user.email ?? null;
  const usesEmailConfirmation =
    !!deleteEmail && !isSyntheticTelegramEmail(deleteEmail);
  const hasCredentialPassword = linkedAccounts.some(
    (row) => row.providerId === "credential" && !!row.password,
  );

  const requiresPasswordDelete = requiresPasswordDeleteReauth({
    hasCredentialPassword,
    email: deleteEmail,
  });

  const reauthMethods = unique([
    ...(profile?.telegramId ? ["Telegram"] : []),
    ...linkedAccounts
      .map((row) => row.providerId)
      .filter((providerId) => providerId !== "credential")
      .map((providerId) => providerLabel[providerId] ?? providerId),
  ]);

  const loginMethods = unique([
    ...(profile?.telegramId
      ? [profile.telegramUsername ? `Telegram (@${profile.telegramUsername})` : "Telegram"]
      : []),
    ...linkedAccounts.map((row) => providerLabel[row.providerId] ?? row.providerId),
  ]);

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Назад в дашборд
        </Link>

        <div className="mt-6">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Аккаунт
          </p>
          <h1 className="mt-2 text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
            Настройки и безопасность
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Здесь находятся данные входа, подтверждение личности и опасные действия
            с аккаунтом.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/40 p-5">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              Профиль
            </div>
            <div className="mt-4 space-y-2 text-[13px] text-muted-foreground">
              <div>
                <span className="text-foreground">Имя:</span>{" "}
                {profile?.name || user.name || "Пользователь"}
              </div>
              <div>
                <span className="text-foreground">Email:</span>{" "}
                {usesEmailConfirmation ? deleteEmail : "обычный email не используется"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 p-5">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Способы входа
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {loginMethods.length > 0 ? (
                loginMethods.map((method) => (
                  <span
                    key={method}
                    className="inline-flex rounded-full border border-border/50 px-3 py-1 text-[12px] text-muted-foreground"
                  >
                    {method}
                  </span>
                ))
              ) : (
                <span className="text-[13px] text-muted-foreground">Текущий провайдер</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border/40 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Опасная зона
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Удаление аккаунта скрыто здесь специально. Это необратимое действие, поэтому
            подтверждение вынесено в отдельный раздел настроек.
          </p>

          <div className="mt-5">
            <DeleteAccountCard
              currentEmail={usesEmailConfirmation ? deleteEmail : null}
              requiresPassword={requiresPasswordDelete}
              authMethods={reauthMethods}
              confirmationMode={usesEmailConfirmation ? "email" : "phrase"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
