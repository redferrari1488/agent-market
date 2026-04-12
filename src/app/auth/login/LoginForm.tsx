"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message || "Ошибка входа");
          setLoading(false);
          return;
        }
      } else {
        const result = await signUp.email({ email, password, name: name || email.split("@")[0] });
        if (result.error) {
          setError(result.error.message || "Ошибка регистрации");
          setLoading(false);
          return;
        }
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Ошибка сервера");
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
        }}
        className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
}
