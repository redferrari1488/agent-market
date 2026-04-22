"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { DELETE_ACCOUNT_CONFIRMATION_PHRASE } from "@/lib/account-deletion";

type Props = {
  currentEmail?: string | null;
  requiresPassword: boolean;
  authMethods: string[];
  confirmationMode: "email" | "phrase";
};

export function DeleteAccountCard({
  currentEmail,
  requiresPassword,
  authMethods,
  confirmationMode,
}: Props) {
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reauthMethodsLabel =
    authMethods.length > 0 ? authMethods.join(", ") : "текущий способ входа";

  const confirmationIsValid =
    confirmationMode === "email"
      ? confirmation.trim().toLowerCase() === (currentEmail ?? "").trim().toLowerCase()
      : confirmation.trim().toUpperCase() === DELETE_ACCOUNT_CONFIRMATION_PHRASE;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: confirmationMode === "email" ? confirmation : undefined,
          confirmation: confirmationMode === "phrase" ? confirmation : undefined,
          password: requiresPassword ? password : undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Не удалось удалить аккаунт");
      }

      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить аккаунт");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/20 text-red-400">
          <TriangleAlert className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-red-400">
            Удалить аккаунт
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Это действие отменит активные подписки, остановит контейнеры и очистит
            сохранённые настройки агентов. Профиль будет обезличен, а вход в аккаунт
            перестанет работать.
          </p>

          <div className="mt-4 space-y-3">
            {confirmationMode === "email" ? (
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                  Подтвердите текущий email
                </label>
                <input
                  type="email"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder={currentEmail ?? ""}
                  className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border"
                />
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border/40 bg-background/70 p-3 text-[12px] leading-relaxed text-muted-foreground">
                  Для этого аккаунта обычный email не используется, поэтому подтверждение
                  удаления делается контрольной фразой.
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                    Введите фразу {DELETE_ACCOUNT_CONFIRMATION_PHRASE}
                  </label>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder={DELETE_ACCOUNT_CONFIRMATION_PHRASE}
                    className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] uppercase outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border"
                  />
                </div>
              </>
            )}

            {requiresPassword ? (
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-border"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-border/40 bg-background/70 p-3 text-[12px] leading-relaxed text-muted-foreground">
                <div>
                  Для удаления без пароля нужна свежая сессия входа через {reauthMethodsLabel}.
                </div>
                <div className="mt-1.5">
                  Если вход был давно, сначала{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    выполните повторный вход
                  </Link>{" "}
                  и затем сразу вернитесь сюда.
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-400">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleDelete}
              disabled={
                loading ||
                !confirmationIsValid ||
                (requiresPassword && password.trim().length === 0)
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Удалить аккаунт
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
