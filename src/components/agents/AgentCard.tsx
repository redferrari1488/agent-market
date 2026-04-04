"use client";

import Link from "next/link";
import { Star, Users, MessageSquare, PenTool, BarChart3, ShoppingCart, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  support: { label: "Поддержка", icon: MessageSquare, color: "text-green-500 bg-green-500/10 border-green-500/20" },
  content: { label: "Контент", icon: PenTool, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  analytics: { label: "Аналитика", icon: BarChart3, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  sales: { label: "Продажи", icon: ShoppingCart, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  monitoring: { label: "Мониторинг", icon: Activity, color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
};

export type Agent = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_monthly: number;
  rating_avg: number;
  rating_count: number;
  purchases_count: number;
  features: string[];
  status: string;
};

export function AgentCard({ agent, index = 0 }: { agent: Agent; index?: number }) {
  const cat = categoryConfig[agent.category] || categoryConfig.support;
  const CategoryIcon = cat.icon;
  const price = (agent.price_monthly / 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        href={`/agents/${agent.slug}`}
        className="group flex h-full flex-col rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-violet-600/50 hover:shadow-lg hover:shadow-violet-600/5"
      >
        {/* Шапка: иконка + бейдж категории */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/10 to-blue-500/10">
            <CategoryIcon className="h-5 w-5 text-violet-500" />
          </div>
          <Badge variant="outline" className={`text-xs ${cat.color}`}>
            {cat.label}
          </Badge>
        </div>

        {/* Название + описание */}
        <h3 className="text-base font-semibold group-hover:text-violet-500 transition-colors">
          {agent.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {agent.description}
        </p>

        {/* Подвал: цена + рейтинг + покупки */}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="text-xl font-bold">${price}</span>
            <span className="text-sm text-muted-foreground">/мес</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {agent.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                {agent.rating_avg.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {agent.purchases_count}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
