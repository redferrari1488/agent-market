"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { signIn, signUp } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

type Props = {
  turnstileSiteKey?: string;
};

export function LoginForm({ turnstileSiteKey }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const turnstileEnabled = Boolean(turnstileSiteKey);

  const resetTurnstile = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (turnstileEnabled && !captchaToken) {
      setError("Подтвердите, что вы не робот.");
      setLoading(false);
      return;
    }

    const captchaFetchOptions = captchaToken
      ? { fetchOptions: { headers: { "x-captcha-response": captchaToken } } }
      : {};

    try {
      if (mode === "login") {
        const result = await signIn.email({ email, password, ...captchaFetchOptions });
        if (result.error) {
          setError(result.error.message || "Ошибка входа");
          if (turnstileEnabled) resetTurnstile();
          setLoading(false);
          return;
        }
      } else {
        const result = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
          ...captchaFetchOptions,
        });
        if (result.error) {
          setError(result.error.message || "Ошибка регистрации");
          if (turnstileEnabled) resetTurnstile();
          setLoading(false);
          return;
        }
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Ошибка сервера");
      if (turnstileEnabled) resetTurnstile();
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль (минимум 8 символов)"
          className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border"
        />
        {turnstileEnabled && turnstileSiteKey && (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-lg border border-border/40 p-3">
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                  setError(null);
                }}
                onExpire={() => {
                  setCaptchaToken(null);
                  setError("Проверка истекла. Подтвердите её ещё раз.");
                }}
                onError={() => {
                  setCaptchaToken(null);
                  setError("Не удалось загрузить защиту от ботов. Обновите страницу.");
                }}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground/70">
              Защита от ботов включена для входа и регистрации по email.
            </p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
          if (turnstileEnabled) resetTurnstile();
        }}
        className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
}
