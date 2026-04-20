"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

type Provider = "google" | "github";

type Props = {
  google?: boolean;
  github?: boolean;
};

export function OAuthButtons({ google = false, github = false }: Props) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!google && !github) return null;

  const handleOAuth = async (provider: Provider) => {
    setLoading(provider);
    setError(null);
    try {
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {google && (
        <button
          onClick={() => handleOAuth("google")}
          disabled={loading !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border/40 text-[13px] font-medium transition-colors hover:border-border disabled:opacity-50"
        >
          {loading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          Продолжить с Google
        </button>
      )}

      {github && (
        <button
          onClick={() => handleOAuth("github")}
          disabled={loading !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border/40 text-[13px] font-medium transition-colors hover:border-border disabled:opacity-50"
        >
          {loading === "github" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitHubIcon className="h-4 w-4" />
          )}
          Продолжить с GitHub
        </button>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-[13px] text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.5 36 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.3-.52-1.48.11-3.08 0 0 .98-.31 3.2 1.18.93-.26 1.92-.39 2.91-.39.99 0 1.98.13 2.91.39 2.22-1.5 3.2-1.18 3.2-1.18.63 1.6.24 2.78.12 3.08.74.8 1.19 1.83 1.19 3.09 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .3.2.66.79.55C20.21 21.37 23.5 17.07 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}
