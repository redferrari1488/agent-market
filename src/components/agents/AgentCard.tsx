"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  Check,
  Zap,
} from "lucide-react";

type CategoryKey = "support" | "content" | "analytics" | "sales" | "monitoring";

const categoryConfig: Record<
  CategoryKey,
  { label: string; icon: React.ElementType; accent: string; bg: string; hoverBorder: string }
> = {
  support: { label: "Поддержка", icon: MessageSquare, accent: "text-blue-400", bg: "bg-blue-500/10", hoverBorder: "hover:border-blue-500/30" },
  content: { label: "Контент", icon: PenTool, accent: "text-violet-400", bg: "bg-violet-500/10", hoverBorder: "hover:border-violet-500/30" },
  analytics: { label: "Аналитика", icon: BarChart3, accent: "text-emerald-400", bg: "bg-emerald-500/10", hoverBorder: "hover:border-emerald-500/30" },
  sales: { label: "Продажи", icon: ShoppingCart, accent: "text-amber-400", bg: "bg-amber-500/10", hoverBorder: "hover:border-amber-500/30" },
  monitoring: { label: "Мониторинг", icon: Activity, accent: "text-cyan-400", bg: "bg-cyan-500/10", hoverBorder: "hover:border-cyan-500/30" },
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

const ease = [0.25, 1, 0.5, 1] as const;

export function AgentCard({ agent }: { agent: Agent; index?: number }) {
  const key =
    agent.category && agent.category in categoryConfig
      ? (agent.category as CategoryKey)
      : "support";
  const cat = categoryConfig[key];
  const CategoryIcon = cat.icon;
  const price = ((agent.price_monthly || 0) / 100).toFixed(0);

  const featureList = Array.isArray(agent.features)
    ? (agent.features as unknown[]).filter(
        (f): f is string => typeof f === "string" && f.length > 0,
      )
    : [];
  const topFeatures = featureList.slice(0, 3);

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.3, ease } }}
    >
      <Link
        href={`/agents/${agent.slug}`}
        className={`group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm shadow-black/5 transition-all duration-300 hover:bg-card hover:shadow-xl hover:shadow-black/15 ${cat.hoverBorder}`}
      >
        <div className="flex flex-1 flex-col p-5">
          {/* Top: icon + category */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cat.bg} ${cat.accent}`}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {cat.label}
              </span>
            </div>
            {agent.rating_count > 0 ? (
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <Star className="h-3 w-3 fill-current text-amber-400" />
                <span className="tabular-nums">{agent.rating_avg.toFixed(1)}</span>
                <span className="text-muted-foreground/70">· {agent.rating_count}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Новый
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-4 text-[16px] font-semibold leading-snug tracking-tight">
            {agent.name}
          </h3>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {agent.description}
          </p>

          {/* Feature checklist */}
          {topFeatures.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {topFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer strip */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-card/40 px-5 py-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[20px] font-semibold leading-none tracking-tight tabular-nums">
              {price}
            </span>
            <span className="text-[11px] text-muted-foreground">₽/мес</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="tabular-nums">{agent.purchases_count}</span>
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              24/7
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
