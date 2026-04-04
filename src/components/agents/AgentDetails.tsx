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
      <p className="text-sm text-muted-foreground">
        Пока нет отзывов. Станьте первым!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, i) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-lg border border-border/50 bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const profile = Array.isArray(review.profiles)
                  ? review.profiles[0]
                  : review.profiles;
                return (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/10 text-xs font-semibold text-violet-500">
                      {(profile?.name || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">
                      {profile?.name || "Пользователь"}
                    </span>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`h-3.5 w-3.5 ${
                    idx < review.rating
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
          {review.text && (
            <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
          )}
          <time className="mt-2 block text-xs text-muted-foreground/60">
            {new Date(review.created_at).toLocaleDateString("ru-RU")}
          </time>
        </motion.div>
      ))}
    </div>
  );
}

export function RatingStars({
  avg,
  count,
}: {
  avg: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`h-4 w-4 ${
              idx < Math.round(avg)
                ? "fill-yellow-500 text-yellow-500"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {avg.toFixed(1)} ({count})
      </span>
    </div>
  );
}
