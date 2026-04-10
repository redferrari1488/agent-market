"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

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
            className="w-full rounded-xl border border-border/50 bg-white/5 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-violet-500/50 focus:bg-white/[0.07]"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-border/50 bg-white/5 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-violet-500/50 focus:bg-white/[0.07]"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль (минимум 8 символов)"
          className="w-full rounded-xl border border-border/50 bg-white/5 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-violet-500/50 focus:bg-white/[0.07]"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-violet-400"
      >
        {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
}
