"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

type Review = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  profiles: { name: string | null; avatar_url: string | null }[] | { name: string | null; avatar_url: string | null } | null;
};

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Пока нет отзывов. Станьте первым!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review, i) => {
        const profile = Array.isArray(review.profiles)
          ? review.profiles[0]
          : review.profiles;

        return (
          <motion.div
            key={review.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-lg border border-border/40 p-4 transition-colors hover:border-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 font-mono text-[10px] font-medium">
                  {(profile?.name || "U")[0].toUpperCase()}
                </div>
                <span className="text-[13px] font-medium">
                  {profile?.name || "Пользователь"}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-3 w-3 ${
                      idx < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.text && (
              <p className="mt-2 text-[13px] text-muted-foreground">{review.text}</p>
            )}
            <time className="mt-2 block text-[11px] text-muted-foreground/50">
              {new Date(review.created_at).toLocaleDateString("ru-RU")}
            </time>
          </motion.div>
        );
      })}
    </div>
  );
}

export function RatingStars({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`h-3.5 w-3.5 ${
              idx < Math.round(avg)
                ? "fill-amber-400 text-amber-400"
                : "text-border"
            }`}
          />
        ))}
      </div>
      <span className="text-[12px] text-muted-foreground">
        {avg.toFixed(1)} ({count})
      </span>
    </div>
  );
}
