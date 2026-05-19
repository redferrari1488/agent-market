"use client";

import { useState } from "react";

type Props = {
  agentId: string;
  agentName: string;
  accentColor?: string;
};

export function WaitlistCTA({ agentId, agentName, accentColor }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Введите корректный email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Не удалось записать");
        return;
      }
      setDone(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-[2px] border border-border/60 bg-secondary/30 p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Записан
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground">
          Спасибо. Напишем на <span className="font-mono">{email}</span> как только запустим {agentName}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        В разработке
      </div>
      <div className="mt-1.5 font-mono text-[1.5rem] font-medium leading-tight tracking-[-0.02em]">
        Скоро
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
        Этого агента ещё нет. Оставь email — напишем когда запустим, и ты получишь скидку первого месяца.
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="your@email.com"
        disabled={loading}
        className="mt-4 h-11 w-full rounded-[2px] border border-border/60 bg-background px-3 font-mono text-[13px] outline-none transition-colors focus:border-foreground/40 disabled:opacity-60"
      />

      <button
        type="button"
        onClick={submit}
        disabled={loading || !email}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[2px] font-mono text-[12.5px] uppercase tracking-[0.06em] transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: accentColor || "var(--foreground)",
          color: accentColor ? "#0a0a09" : "var(--background)",
        }}
      >
        {loading ? "Записываем…" : "Сообщить когда запустим →"}
      </button>
      {error && <p className="mt-2 text-center text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
