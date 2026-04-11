"use client";

import Link from "next/link";
import { useRef } from "react";
import { Star, Users, MessageSquare, PenTool, BarChart3, ShoppingCart, Activity } from "lucide-react";
import { motion } from "framer-motion";

const categoryConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; glow: string; strip: string }
> = {
  support: {
    label: "Поддержка",
    icon: MessageSquare,
    color: "text-blue-400 bg-blue-500/10",
    glow: "rgba(59,130,246,0.18)",
    strip: "from-blue-500/60 via-blue-400/20 to-transparent",
  },
  content: {
    label: "Контент",
    icon: PenTool,
    color: "text-violet-400 bg-violet-500/10",
    glow: "rgba(139,92,246,0.2)",
    strip: "from-violet-500/60 via-violet-400/20 to-transparent",
  },
  analytics: {
    label: "Аналитика",
    icon: BarChart3,
    color: "text-emerald-400 bg-emerald-500/10",
    glow: "rgba(16,185,129,0.18)",
    strip: "from-emerald-500/60 via-emerald-400/20 to-transparent",
  },
  sales: {
    label: "Продажи",
    icon: ShoppingCart,
    color: "text-amber-400 bg-amber-500/10",
    glow: "rgba(245,158,11,0.18)",
    strip: "from-amber-500/60 via-amber-400/20 to-transparent",
  },
  monitoring: {
    label: "Мониторинг",
    icon: Activity,
    color: "text-cyan-400 bg-cyan-500/10",
    glow: "rgba(6,182,212,0.18)",
    strip: "from-cyan-500/60 via-cyan-400/20 to-transparent",
  },
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
};

export function AgentCard({ agent, index = 0 }: { agent: Agent; index?: number }) {
  const cat = categoryConfig[agent.category || "support"] || categoryConfig.support;
  const CategoryIcon = cat.icon;
  const price = ((agent.price_monthly || 0) / 100).toFixed(0);
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <Link
        ref={cardRef}
        onMouseMove={handleMouseMove}
        href={`/agents/${agent.slug}`}
        style={
          {
            "--glow": cat.glow,
          } as React.CSSProperties
        }
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
      >
        {/* Category accent strip (Resend-style) */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${cat.strip}`}
        />

        {/* Cursor-reactive radial glow (Raycast-style) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), var(--glow), transparent 60%)",
          }}
        />

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.color}`}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{cat.label}</span>
          </div>
          {agent.rating_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
              <Star className="h-3 w-3 fill-yellow-400" />
              {agent.rating_avg.toFixed(1)}
            </span>
          )}
        </div>

        {/* Title + description */}
        <h3 className="text-base font-bold leading-tight">{agent.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {agent.description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border/30 pt-4">
          <span className="text-lg font-bold">
            {price} <span className="text-xs font-normal text-muted-foreground">₽/мес</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {agent.purchases_count}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
