"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { normalizeAgentFeatureList } from "@/lib/agent-copy";

type CategoryKey = "support" | "content" | "analytics" | "sales" | "monitoring";

const CATEGORY: Record<CategoryKey, { label: string; glow: string; text: string }> = {
  support:    { label: "поддержка",  glow: "59,130,246",  text: "#93c5fd" },
  content:    { label: "контент",    glow: "139,92,246",  text: "#c4b5fd" },
  analytics:  { label: "аналитика",  glow: "16,185,129",  text: "#6ee7b7" },
  sales:      { label: "продажи",    glow: "245,158,11",  text: "#fcd34d" },
  monitoring: { label: "мониторинг", glow: "6,182,212",   text: "#67e8f9" },
};

type BadgeKey = "hireon" | "lock_in" | "external";
const BADGE: Record<BadgeKey, { label: string; glow: string; text: string }> = {
  hireon:   { label: "hireon",   glow: "139,92,246",  text: "#c4b5fd" },
  lock_in:  { label: "lock-in",  glow: "245,158,11",  text: "#fcd34d" },
  external: { label: "внешний",  glow: "255,255,255", text: "#a1a1aa" },
};

export type Agent = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  price_monthly: number | null;
  rating_avg: number;
  rating_count: number;
  purchases_count: number;
  features: unknown;
  status: string;
  brand?: string | null;
  is_external?: boolean;
};

function isCategoryKey(v: string | null): v is CategoryKey {
  return v === "support" || v === "content" || v === "analytics" || v === "sales" || v === "monitoring";
}

export function AgentCard({ agent }: { agent: Agent }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const catKey: CategoryKey = isCategoryKey(agent.category) ? agent.category : "support";
  const cat = CATEGORY[catKey];

  const badgeKey: BadgeKey = agent.is_external
    ? "external"
    : agent.brand === "lock_in"
      ? "lock_in"
      : "hireon";
  const badge = BADGE[badgeKey];

  const features = normalizeAgentFeatureList(agent.features).slice(0, 3);
  const price =
    agent.price_monthly != null
      ? Math.round(agent.price_monthly / 100).toLocaleString("ru-RU")
      : null;

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || !glowRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glowRef.current.style.background =
        `radial-gradient(280px circle at ${x}px ${y}px, rgba(${cat.glow},0.13) 0%, transparent 70%)`;
    },
    [cat.glow]
  );

  const onMouseLeave = () => {
    setHovered(false);
    if (glowRef.current) glowRef.current.style.background = "transparent";
  };

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="block rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
    >
      <motion.div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative h-full overflow-hidden rounded-[10px] border border-border/40 bg-card/40 p-5 transition-[border-color,box-shadow] duration-300"
        style={{
          borderColor: hovered ? `rgba(${cat.glow},0.3)` : undefined,
          boxShadow: hovered
            ? `0 8px 32px rgba(${cat.glow},0.12), 0 0 0 1px rgba(${cat.glow},0.08)`
            : undefined,
        }}
      >
        {/* spotlight */}
        <div ref={glowRef} aria-hidden className="pointer-events-none absolute inset-0" />

        {/* top: chip + badge */}
        <div className="relative flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em]"
            style={{
              backgroundColor: `rgba(${cat.glow},0.12)`,
              borderColor: `rgba(${cat.glow},0.35)`,
              color: cat.text,
            }}
          >
            {cat.label}
          </span>
          <span
            className="inline-flex items-center rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em]"
            style={{
              backgroundColor: `rgba(${badge.glow},0.12)`,
              borderColor: `rgba(${badge.glow},0.3)`,
              color: badge.text,
            }}
          >
            {badge.label}
          </span>
        </div>

        {/* title */}
        <h3 className="relative mt-3 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {agent.name}
        </h3>

        {/* desc */}
        <p className="relative mt-1.5 line-clamp-2 text-[13px] leading-[1.55] text-muted-foreground">
          {agent.description}
        </p>

        {/* features */}
        {features.length > 0 && (
          <ul className="relative mt-3.5 flex flex-col gap-1.5">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-[12px] text-muted-foreground/80"
              >
                <span
                  aria-hidden
                  className="block h-[3px] w-[3px] shrink-0 rounded-full"
                  style={{ backgroundColor: `rgba(${cat.glow},0.7)` }}
                />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* bottom strip */}
        <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3.5">
          <div>
            {price ? (
              <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">
                {price}
                <span className="ml-1 text-[11px] text-muted-foreground/60">₽/мес</span>
              </span>
            ) : (
              <span className="font-mono text-[12px] text-muted-foreground/60">у продавца</span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground/60">
            {agent.rating_count > 0 && (
              <span>★ {agent.rating_avg.toFixed(1)} · {agent.rating_count}</span>
            )}
            <span>↑ {agent.purchases_count}</span>
          </div>
        </div>

        {/* hover gradient line */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `linear-gradient(90deg, transparent, rgba(${cat.glow},0.6), transparent)`,
          }}
        />
      </motion.div>
    </Link>
  );
}
