"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export type TelegramAuthPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type Props = {
  payload: TelegramAuthPayload | null;
};

// Mobile flow: oauth.telegram.org/auth redirects back with payload in URL hash
// (#tgAuthResult=BASE64URL_JSON), not in query string. Hash isn't sent to the
// server, so we parse it on the client.
function parseHashPayload(): TelegramAuthPayload | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const raw = params.get("tgAuthResult");
  if (!raw) return null;
  try {
    let b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = JSON.parse(atob(b64));
    if (
      typeof json.id !== "number" ||
      typeof json.auth_date !== "number" ||
      typeof json.first_name !== "string" ||
      typeof json.hash !== "string"
    ) {
      return null;
    }
    return json as TelegramAuthPayload;
  } catch {
    return null;
  }
}

export function TelegramCallbackHandler({ payload }: Props) {
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedPayload, setResolvedPayload] = useState<TelegramAuthPayload | null>(payload);
  const [hashChecked, setHashChecked] = useState(false);

  useEffect(() => {
    if (!payload) {
      const fromHash = parseHashPayload();
      if (fromHash) {
        setResolvedPayload(fromHash);
        // Clear the hash so a refresh doesn't re-trigger / leak the token in URL.
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    setHashChecked(true);
  }, [payload]);

  useEffect(() => {
    if (!hashChecked) return;
    if (!resolvedPayload) {
      setError("Telegram не передал данные для входа.");
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    const completeLogin = async () => {
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resolvedPayload),
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Ошибка");
        }

        window.location.href = "/dashboard";
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Ошибка");
        }
      }
    };

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [hashChecked, resolvedPayload]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px-1px)] max-w-6xl items-center justify-center px-5 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-lg border border-border/40 p-6 text-center sm:p-8">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Telegram
        </p>
        <h1 className="mt-3 text-[1.5rem] font-bold tracking-[-0.02em] sm:text-[1.75rem]">
          Завершаем вход
        </h1>

        {error ? (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Не удалось завершить вход через Telegram.
            </p>
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
            <Link
              href="/auth/login"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg border border-border/40 text-[13px] font-medium transition-colors hover:border-border"
            >
              Вернуться ко входу
            </Link>
          </>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Проверяем данные и создаём сессию...
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground/70">
              Если редирект не сработает автоматически, вернитесь на страницу входа и повторите
              попытку.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
