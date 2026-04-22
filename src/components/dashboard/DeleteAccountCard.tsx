"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

type Props = {
  currentEmail: string;
  requiresPassword: boolean;
  authMethods: string[];
};

export function DeleteAccountCard({
  currentEmail,
  requiresPassword,
  authMethods,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
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
    <div className="mt-10 rounded-lg border border-red-500/20 bg-red-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/20 text-red-400">
          <TriangleAlert className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-red-400">
            Удалить аккаунт
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Это действие отменит активные подписки, остановит контейнеры и очистит сохранённые
            настройки агентов. Профиль будет обезличен, а вход в аккаунт перестанет работать.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                Подтвердите текущий email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentEmail}
                className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border"
              />
            </div>

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
                  Для аккаунтов без обычного пароля требуется свежая сессия входа через{" "}
                  {authMethods.join(", ")}.
                </div>
                <div className="mt-1.5">
                  Если вход был давно, сначала{" "}
                  <Link href="/auth/login" className="underline underline-offset-4 hover:text-foreground">
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
                email.trim().toLowerCase() !== currentEmail.trim().toLowerCase() ||
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
