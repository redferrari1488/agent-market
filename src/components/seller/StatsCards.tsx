"use client";

import { Package, Users, TrendingUp, Wallet } from "lucide-react";
import { formatMoneySummary, type MoneyByCurrency } from "@/lib/money";

type Stats = {
  totalAgents: number;
  publishedAgents: number;
  draftAgents: number;
  reviewAgents: number;
  totalSubs: number;
  activeSubs: number;
  totalRevenue: MoneyByCurrency;
  sellerRevenue: MoneyByCurrency;
  totalPaidOut: MoneyByCurrency;
};

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Агенты",
      value: stats.totalAgents,
      sub: `${stats.publishedAgents} опубл. / ${stats.draftAgents} черн.`,
      icon: Package,
    },
    {
      label: "Покупатели",
      value: stats.totalSubs,
      sub: `${stats.activeSubs} активных`,
      icon: Users,
    },
    {
      label: "Ваш доход",
      value: formatMoneySummary(stats.sellerRevenue),
      sub: `Оборот ${formatMoneySummary(stats.totalRevenue)} · 0% комиссии`,
      icon: TrendingUp,
    },
    {
      label: "Выплачено",
      value: formatMoneySummary(stats.totalPaidOut),
      sub: "Завершённые выплаты",
      icon: Wallet,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-[2px] border border-white/[0.08] bg-[#111115] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {card.label}
              </span>
              <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
            </div>
            <div className="mt-3 font-mono text-[1.4rem] font-medium tracking-[-0.01em] tabular-nums">
              {card.value}
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground/70">
              {card.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}
