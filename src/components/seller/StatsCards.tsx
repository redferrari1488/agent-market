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
      color: "text-violet-500",
    },
    {
      label: "Покупатели",
      value: stats.totalSubs,
      sub: `${stats.activeSubs} активных`,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Ваш доход",
      value: `${formatPrice(stats.sellerRevenue)} ₽`,
      sub: `Всего ${formatPrice(stats.totalRevenue)} ₽ (−15% комиссия)`,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Выплачено",
      value: `${formatPrice(stats.totalPaidOut)} ₽`,
      sub: "Завершённые выплаты",
      icon: Wallet,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className="mt-2 text-xl font-bold">{card.value}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
