"use client";

import Link from "next/link";
import {
  Star,
  Users,
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
  ArrowUpRight,
} from "lucide-react";

type CategoryKey = "support" | "content" | "analytics" | "sales" | "monitoring";

const categoryConfig: Record<
  CategoryKey,
  { label: string; icon: React.ElementType; accent: string }
> = {
  support: { label: "Поддержка", icon: MessageSquare, accent: "text-blue-400" },
  content: { label: "Контент", icon: PenTool, accent: "text-violet-400" },
  analytics: { label: "Аналитика", icon: BarChart3, accent: "text-emerald-400" },
  sales: { label: "Продажи", icon: ShoppingCart, accent: "text-amber-400" },
  monitoring: { label: "Мониторинг", icon: Activity, accent: "text-cyan-400" },
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

export function AgentCard({ agent }: { agent: Agent; index?: number }) {
  const key =
    agent.category && agent.category in categoryConfig
      ? (agent.category as CategoryKey)
      : "support";
  const cat = categoryConfig[key];
  const CategoryIcon = cat.icon;
  const price = ((agent.price_monthly || 0) / 100).toFixed(0);

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group flex h-full flex-col rounded-xl border border-border/40 bg-background p-5 transition-colors hover:border-border"
    >
      {/* Top: icon + category */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 ${cat.accent}`}>
            <CategoryIcon className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
            {cat.label}
          </span>
        </div>
        {agent.rating_count > 0 && (
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Star className="h-3 w-3 fill-current text-amber-400" />
            {agent.rating_avg.toFixed(1)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-4 text-[15px] font-semibold leading-snug tracking-tight">
        {agent.name}
      </h3>

      {/* Description */}
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {agent.description}
      </p>

      {/* Footer */}
      <div className="mt-auto flex items-end justify-between pt-5">
        <div>
          <span className="text-xl font-semibold tracking-tight">{price}</span>
          <span className="ml-1 text-[12px] text-muted-foreground">₽/мес</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {agent.purchases_count}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
        </div>
      </div>
    </Link>
  );
}
