"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CircleButton } from "./OAuthButtons";

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
    Telegram?: {
      Login?: {
        auth: (
          options: { bot_id: string; request_access?: boolean | "write"; lang?: string },
          callback: (user: TelegramUser | false) => void,
        ) => void;
      };
    };
  }
}

type Props = {
  botId?: string;
  fallbackUrl?: string;
  nonce?: string;
  isMobile?: boolean;
};

export function TelegramLoginButton({ botId, fallbackUrl, nonce, isMobile = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (isMobile) return;
    if (window.Telegram?.Login?.auth) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-telegram-widget="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    if (nonce) script.setAttribute("nonce", nonce);
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.dataset.telegramWidget = "true";
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, [isMobile, nonce]);

  function handleClick() {
    if (isMobile && fallbackUrl) {
      window.location.href = fallbackUrl;
      return;
    }
    if (!botId) {
      setError("Telegram не настроен");
      return;
    }
    if (!window.Telegram?.Login?.auth) {
      if (fallbackUrl) {
        window.location.href = fallbackUrl;
        return;
      }
      setError("Виджет Telegram не загрузился");
      return;
    }
    setLoading(true);
    setError(null);
    window.Telegram.Login.auth({ bot_id: botId, request_access: "write" }, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Ошибка");
        window.location.href = "/dashboard";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
        setLoading(false);
      }
    });
  }

  const disabled = !isMobile && !scriptReady && !fallbackUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      <CircleButton
        label="Telegram"
        loading={loading}
        disabled={disabled}
        onClick={handleClick}
      >
        <TelegramIcon className="h-5 w-5 text-[#27a7e7]" />
      </CircleButton>
      {error && (
        <p className="text-center text-[11px] text-red-400">{error}</p>
      )}
      {loading && !error && (
        <p className="flex items-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Вход через Telegram...
        </p>
      )}
    </div>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}
