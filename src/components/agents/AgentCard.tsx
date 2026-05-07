"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { categoryColor, categoryLabel } from "@/lib/category-color";

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
  keywords?: string[];
  status: string;
  brand?: string | null;
  is_external?: boolean;
  external_url?: string | null;
  _score?: number;
};

const ease = [0.25, 1, 0.5, 1] as const;

export function AgentCard({
  agent,
  highlight = 0,
}: {
  agent: Agent;
  index?: number;
  highlight?: number;
}) {
  const [hov, setHov] = useState(false);
  const cc = categoryColor(agent.category);
  const isExt = !!agent.is_external;
  const isLockIn = agent.brand === "lock_in";
  const price =
    agent.price_monthly != null
      ? `${(agent.price_monthly / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`
      : "У продавца";

  const href = isExt && agent.external_url ? agent.external_url : `/agents/${agent.slug}`;

  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.25, ease } }}>
      <Link
        href={href}
        target={isExt ? "_blank" : undefined}
        rel={isExt ? "noopener noreferrer" : undefined}
        className="group relative flex h-full flex-col overflow-hidden rounded-[2px] border bg-card/40 transition-all duration-200"
        style={{
          borderColor: hov ? `${cc.replace(")", " / 0.32)")}` : "rgba(255,255,255,0.06)",
          boxShadow: hov
            ? `0 8px 32px rgba(0,0,0,.45), 0 0 0 1px ${cc.replace(")", " / 0.1)")}`
            : "none",
          background: hov ? "var(--card)" : "color-mix(in oklch, var(--card) 55%, transparent)",
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <div
          className="h-[2px] transition-opacity duration-200"
          style={{ background: cc, opacity: hov ? 1 : 0.4 }}
        />

        {highlight > 0 && (
          <div
            className="pointer-events-none absolute right-3 top-2.5 font-mono text-[9px] tracking-[0.06em]"
            style={{ color: cc, opacity: 0.7 }}
          >
            {"·".repeat(Math.min(highlight, 5))}
          </div>
        )}

        <div className="flex flex-1 flex-col p-3 sm:p-[18px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="font-mono text-[10px] tracking-[0.08em] lowercase"
              style={{ color: cc, opacity: 0.9 }}
            >
              {categoryLabel(agent.category).toLowerCase()}
            </span>
            {isLockIn && (
              <span
                className="rounded-[2px] border px-1.5 py-[1px] font-mono text-[9px] tracking-[0.06em] uppercase"
                style={{
                  color: "var(--primary)",
                  borderColor: "color-mix(in oklch, var(--primary) 35%, transparent)",
                }}
              >
                lock-in
              </span>
            )}
            {isExt && (
              <span className="rounded-[2px] border border-border/50 px-1.5 py-[1px] font-mono text-[9px] tracking-[0.06em] uppercase text-muted-foreground/70">
                внешний
              </span>
            )}
          </div>

          <h3
            className="mt-2 line-clamp-2 text-[14px] font-extrabold leading-[1.2] tracking-[-0.01em] sm:mt-2.5 sm:text-[16px]"
            style={{ color: hov ? "#fff" : "var(--foreground)" }}
          >
            {agent.name}
          </h3>

          {agent.description && (
            <p className="mt-1.5 line-clamp-1 text-[11.5px] leading-[1.5] text-muted-foreground/80 sm:mt-2 sm:line-clamp-2 sm:text-[12px] sm:leading-[1.55]">
              {agent.description}
            </p>
          )}

          <div className="my-2.5 h-px bg-border/30 sm:my-3" />

          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div
                className="font-mono leading-none"
                style={{
                  fontSize: isExt ? "11px" : "15px",
                  letterSpacing: isExt ? "0.05em" : "-0.01em",
                  color: isExt ? "var(--muted-foreground)" : "var(--foreground)",
                  fontWeight: 500,
                }}
              >
                {price}
              </div>
              <div className="mt-0.5 font-mono text-[9px] tracking-[0.04em] text-muted-foreground/55 sm:mt-1">
                {isExt
                  ? agent.brand && agent.brand !== "hireon" && agent.brand !== "lock_in"
                    ? agent.brand
                    : "у продавца"
                  : "/месяц"}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 sm:gap-1.5">
              {agent.rating_count >= 3 && (
                <div className="hidden font-mono text-[10px] text-muted-foreground/60 whitespace-nowrap sm:block">
                  ★ {agent.rating_avg.toFixed(1)} · {agent.rating_count}
                </div>
              )}
              <span
                className="rounded-[2px] border px-2 py-[3px] font-mono text-[10px] tracking-[0.04em] whitespace-nowrap transition-colors duration-200 sm:px-2.5 sm:py-1 sm:text-[10.5px]"
                style={{
                  background: hov ? (isExt ? "rgba(255,255,255,0.06)" : cc) : "transparent",
                  color: hov
                    ? isExt
                      ? "var(--muted-foreground)"
                      : "#0c0c0e"
                    : "color-mix(in oklch, var(--muted-foreground) 85%, transparent)",
                  borderColor: hov
                    ? isExt
                      ? "rgba(255,255,255,0.12)"
                      : cc
                    : "rgba(255,255,255,0.08)",
                }}
              >
                {isExt ? "перейти ↗" : "нанять →"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
