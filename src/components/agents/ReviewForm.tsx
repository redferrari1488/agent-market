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
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-500">
        Спасибо за отзыв!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border p-4"
    >
      <h3 className="text-sm font-bold">Оставить отзыв</h3>

      <div className="mt-3 flex items-center gap-1">
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
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  filled ? "fill-yellow-500 text-yellow-500" : "text-border"
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
        className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {error && (
        <div className="mt-2 text-xs text-red-500">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        Отправить
      </button>
    </form>
  );
}
