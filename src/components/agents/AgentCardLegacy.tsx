"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  Check,
} from "lucide-react";

import { normalizeAgentFeatureList } from "@/lib/agent-copy";
import type { Agent } from "./AgentCard";
import { AgentIcon, hasAgentIcon } from "./AgentIcon";

type CategoryKey = "support" | "content" | "analytics" | "sales" | "monitoring";

const categoryConfig: Record<
  CategoryKey,
  { label: string; icon: React.ElementType }
> = {
  support: { label: "Поддержка", icon: MessageSquare },
  content: { label: "Контент", icon: PenTool },
  analytics: { label: "Аналитика", icon: BarChart3 },
  sales: { label: "Продажи", icon: ShoppingCart },
  monitoring: { label: "Мониторинг", icon: Activity },
};

const ease = [0.25, 1, 0.5, 1] as const;

export function AgentCardLegacy({ agent }: { agent: Agent }) {
  const key =
    agent.category && agent.category in categoryConfig
      ? (agent.category as CategoryKey)
      : "support";
  const cat = categoryConfig[key];
  const CategoryIcon = cat.icon;
  const price = ((agent.price_monthly || 0) / 100).toFixed(0);

  const featureList = normalizeAgentFeatureList(agent.features);
  const topFeatures = featureList.slice(0, 3);

  return (
    <motion.div whileHover={{ y: -6, transition: { duration: 0.3, ease } }} className="h-full">
      <Link
        href={`/agents/${agent.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-[rgba(244,236,222,0.10)] bg-[#161412] shadow-sm shadow-black/20 transition-all duration-300 hover:border-[oklch(0.74_0.13_195_/_0.55)] hover:shadow-xl hover:shadow-black/40"
      >
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(244,236,222,0.06)] bg-[#1a1815] text-[rgba(241,235,224,0.78)] transition-colors group-hover:text-[oklch(0.74_0.13_195)]">
                {hasAgentIcon(agent.slug) ? (
                  <AgentIcon slug={agent.slug} size={18} />
                ) : (
                  <CategoryIcon className="h-4 w-4" />
                )}
              </div>
              <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-[rgba(241,235,224,0.36)]">
                {cat.label}
              </span>
              {agent.brand === "lock_in" && (
                <span className="rounded-md border border-[rgba(244,236,222,0.10)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[rgba(241,235,224,0.36)]">
                  Lock-in
                </span>
              )}
              {agent.is_external && (
                <span className="rounded-md border border-[rgba(244,236,222,0.10)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[rgba(241,235,224,0.36)]">
                  Внешний
                </span>
              )}
            </div>
          </div>

          <h3 className="mt-4 text-[16px] font-semibold leading-snug tracking-tight text-[#f1ebe0]">
            {agent.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[rgba(241,235,224,0.78)]">
            {agent.description}
          </p>

          {topFeatures.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {topFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-[12px] leading-relaxed text-[rgba(241,235,224,0.78)]"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[oklch(0.74_0.13_195)]" />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3 border-t border-[rgba(244,236,222,0.06)] bg-[#1a1815] px-4 sm:px-5 py-3">
          {agent.is_external ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[rgba(241,235,224,0.36)]">У&nbsp;продавца</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] sm:text-[20px] font-semibold leading-none tracking-tight tabular-nums text-[#f1ebe0]">
                {price}
              </span>
              <span className="font-mono text-[11px] text-[rgba(241,235,224,0.36)]">₽/мес</span>
            </div>
          )}
          <ArrowUpRight className="h-3.5 w-3.5 text-[rgba(241,235,224,0.36)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[oklch(0.74_0.13_195)]" />
        </div>
      </Link>
    </motion.div>
  );
}
