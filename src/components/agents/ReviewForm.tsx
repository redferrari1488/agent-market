"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";

export function ReviewForm({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Поставьте оценку");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-[13px] text-emerald-400">
        Спасибо за отзыв!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/40 p-5"
    >
      <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        Оставить отзыв
      </h3>

      <div className="mt-4 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const idx = i + 1;
          const filled = idx <= (hover || rating);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setRating(idx)}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5"
              aria-label={`${idx} ${idx === 1 ? "звезда" : "звёзд"}`}
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  filled ? "fill-amber-400 text-amber-400" : "text-border"
                }`}
              />
            </button>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Коротко о вашем опыте (необязательно)"
        className="mt-4 w-full resize-none rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] leading-relaxed outline-none transition-colors focus:border-border"
      />

      {error && (
        <div className="mt-2 text-[12px] text-red-400">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Отправить
      </button>
    </form>
  );
}
