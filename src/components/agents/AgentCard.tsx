"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  Star,
  Users,
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

type CategoryKey = "support" | "content" | "analytics" | "sales" | "monitoring";

type CategoryConfig = {
  label: string;
  icon: React.ElementType;
  // Card-level tint (background gradient + accent rgb)
  cardBg: string;
  accent: string; // rgb triple, e.g. "59 130 246"
  iconBg: string;
  iconText: string;
  priceText: string;
  borderHover: string;
};

const categoryConfig: Record<CategoryKey, CategoryConfig> = {
  support: {
    label: "Поддержка",
    icon: MessageSquare,
    cardBg:
      "bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(59,130,246,0.22),transparent_55%),linear-gradient(145deg,#0b1220_0%,#080a13_100%)]",
    accent: "59 130 246",
    iconBg: "bg-blue-500/20",
    iconText: "text-blue-300",
    priceText: "text-blue-300",
    borderHover: "hover:border-blue-400/40",
  },
  content: {
    label: "Контент",
    icon: PenTool,
    cardBg:
      "bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(139,92,246,0.26),transparent_55%),linear-gradient(145deg,#120b1f_0%,#0a0712_100%)]",
    accent: "139 92 246",
    iconBg: "bg-violet-500/20",
    iconText: "text-violet-300",
    priceText: "text-violet-300",
    borderHover: "hover:border-violet-400/40",
  },
  analytics: {
    label: "Аналитика",
    icon: BarChart3,
    cardBg:
      "bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(16,185,129,0.22),transparent_55%),linear-gradient(145deg,#07150f_0%,#060d0a_100%)]",
    accent: "16 185 129",
    iconBg: "bg-emerald-500/20",
    iconText: "text-emerald-300",
    priceText: "text-emerald-300",
    borderHover: "hover:border-emerald-400/40",
  },
  sales: {
    label: "Продажи",
    icon: ShoppingCart,
    cardBg:
      "bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(245,158,11,0.22),transparent_55%),linear-gradient(145deg,#1a130a_0%,#0e0a05_100%)]",
    accent: "245 158 11",
    iconBg: "bg-amber-500/20",
    iconText: "text-amber-300",
    priceText: "text-amber-300",
    borderHover: "hover:border-amber-400/40",
  },
  monitoring: {
    label: "Мониторинг",
    icon: Activity,
    cardBg:
      "bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(6,182,212,0.22),transparent_55%),linear-gradient(145deg,#071519_0%,#060d10_100%)]",
    accent: "6 182 212",
    iconBg: "bg-cyan-500/20",
    iconText: "text-cyan-300",
    priceText: "text-cyan-300",
    borderHover: "hover:border-cyan-400/40",
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
  const key = (agent.category as CategoryKey) in categoryConfig
    ? (agent.category as CategoryKey)
    : "support";
  const cat = categoryConfig[key];
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
      className="h-full"
    >
      <Link
        ref={cardRef}
        onMouseMove={handleMouseMove}
        href={`/agents/${agent.slug}`}
        style={
          {
            "--accent": cat.accent,
          } as React.CSSProperties
        }
        className={`group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] transition-all duration-300 ${cat.cardBg} ${cat.borderHover} hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40`}
      >
        {/* Cursor-reactive highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--accent) / 0.2), transparent 55%)",
          }}
        />

        {/* Decorative blurred blob in category color, bottom-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full opacity-40 blur-3xl transition-opacity duration-300 group-hover:opacity-60"
          style={{ background: "rgb(var(--accent) / 0.35)" }}
        />

        {/* Top row: icon + rating */}
        <div className="relative flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.iconBg} ${cat.iconText} ring-1 ring-white/10 backdrop-blur-sm`}
          >
            <CategoryIcon className="h-6 w-6" />
          </div>
          {agent.rating_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-yellow-300 ring-1 ring-white/10 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-yellow-300" />
              {agent.rating_avg.toFixed(1)}
            </span>
          )}
        </div>

        {/* Category label */}
        <div className="relative mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
          {cat.label}
        </div>

        {/* Title */}
        <h3 className="relative mt-1.5 text-lg font-bold leading-tight tracking-tight text-white">
          {agent.name}
        </h3>

        {/* Description */}
        <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">
          {agent.description}
        </p>

        {/* Footer */}
        <div className="relative mt-auto flex items-end justify-between pt-6">
          <div>
            <div className={`text-2xl font-bold tracking-tight ${cat.priceText}`}>
              {price}
              <span className="ml-1 text-xs font-medium text-white/40">₽/мес</span>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <Users className="h-3.5 w-3.5" />
            {agent.purchases_count}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
