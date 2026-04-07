"use client";

import Link from "next/link";
import { Star, Users, MessageSquare, PenTool, BarChart3, ShoppingCart, Activity } from "lucide-react";
import { motion } from "framer-motion";

const categoryConfig: Record<string, { label: string; icon: React.ElementType }> = {
  support: { label: "Поддержка", icon: MessageSquare },
  content: { label: "Контент", icon: PenTool },
  analytics: { label: "Аналитика", icon: BarChart3 },
  sales: { label: "Продажи", icon: ShoppingCart },
  monitoring: { label: "Мониторинг", icon: Activity },
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
  const featuresList = Array.isArray(agent.features) ? agent.features as string[] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <Link
        href={`/agents/${agent.slug}`}
        className="group flex h-full flex-col rounded-xl border border-border bg-background p-4 transition-colors hover:bg-secondary"
      >
        {/* Шапка */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{cat.label}</span>
          </div>
          {agent.rating_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {agent.rating_avg.toFixed(1)}
            </span>
          )}
        </div>

        {/* Название + описание */}
        <h3 className="text-[15px] font-bold leading-tight">
          {agent.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {agent.description}
        </p>

        {/* Подвал */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-[15px] font-bold">
            ${price}<span className="text-xs font-normal text-muted-foreground">/мес</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {agent.purchases_count}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
