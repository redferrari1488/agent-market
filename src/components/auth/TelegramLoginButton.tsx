"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

type Props = {
  botUsername: string;
  fallbackUrl?: string;
  nonce?: string;
  showWidget?: boolean;
};

export function TelegramLoginButton({
  botUsername,
  fallbackUrl,
  nonce,
  showWidget = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showWidget) return;

    window.onTelegramAuth = async (user: TelegramUser) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Ошибка");

        // Сессия установлена сервером через Set-Cookie
        window.location.href = "/dashboard";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
        setLoading(false);
      }
    };

    const script = document.createElement("script");
    // strict-dynamic CSP: even though useEffect-inserted scripts inherit trust
    // from the React runtime, Telegram's widget bootstraps additional inline
    // handlers that some browsers refuse without an explicit nonce on the
    // parser-visible <script> tag.
    if (nonce) script.setAttribute("nonce", nonce);
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "20");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    ref.current?.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botUsername, nonce, showWidget]);

  return (
    <div className="space-y-3">
      {showWidget && <div ref={ref} className="flex justify-center" />}
      {fallbackUrl && (
        <div className="space-y-2">
          <a
            href={fallbackUrl}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border/40 text-[13px] font-medium transition-colors hover:border-border"
          >
            Открыть в Telegram
          </a>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
            {showWidget
              ? "Если кнопка выше не появилась на телефоне, откройте вход напрямую."
              : "На телефоне вход через Telegram открывается по прямой ссылке."}
          </p>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Вход через Telegram...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
