"use client";

import { Package, Users, TrendingUp, Wallet } from "lucide-react";

type Stats = {
  totalAgents: number;
  publishedAgents: number;
  draftAgents: number;
  reviewAgents: number;
  totalSubs: number;
  activeSubs: number;
  totalRevenue: number;
  sellerRevenue: number;
  totalPaidOut: number;
};

function formatPrice(kopecks: number) {
  return new Intl.NumberFormat("ru-RU").format(kopecks / 100);
}

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
      value: `${formatPrice(stats.sellerRevenue)} ₽`,
      sub: `Всего ${formatPrice(stats.totalRevenue)} ₽ (−15% комиссия)`,
      icon: TrendingUp,
    },
    {
      label: "Выплачено",
      value: `${formatPrice(stats.totalPaidOut)} ₽`,
      sub: "Завершённые выплаты",
      icon: Wallet,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-lg border border-border/40 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {card.label}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="mt-3 text-[1.5rem] font-bold tracking-tight">{card.value}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
