"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setStep("otp");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
    } else {
      // Полная перезагрузка, чтобы middleware увидело свежие auth-куки
      window.location.href = "/dashboard";
    }
  };

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Mail className="h-4 w-4 text-primary" />
            Код отправлен
          </div>
          <p className="mt-1 text-muted-foreground">
            Введите код из письма на <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-center text-lg font-mono tracking-widest outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            onClick={(e) => {
              if (otp.length < 6) e.preventDefault();
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Войти
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
            setStep("email");
            setOtp("");
            setError(null);
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Другой email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSendOtp} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Получить код
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

    </div>
  );
}
