"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
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
};

export function TelegramLoginButton({ botUsername }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Коллбэк, который Telegram Widget вызовет из своего скрипта
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

        // Завершаем логин в браузере через token_hash
        const supabase = createClient();
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: json.data.token_hash,
          type: "magiclink",
        });
        if (verifyErr) throw new Error(verifyErr.message);

        window.location.href = "/dashboard";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
        setLoading(false);
      }
    };

    // Вставляем telegram-widget.js в DOM
    const script = document.createElement("script");
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
  }, [botUsername]);

  return (
    <div className="space-y-2">
      <div ref={ref} className="flex justify-center" />
      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Вход через Telegram…
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
