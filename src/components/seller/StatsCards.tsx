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
      color: "text-violet-400 bg-violet-500/10",
      glow: "bg-violet-500/10",
    },
    {
      label: "Покупатели",
      value: stats.totalSubs,
      sub: `${stats.activeSubs} активных`,
      icon: Users,
      color: "text-blue-400 bg-blue-500/10",
      glow: "bg-blue-500/10",
    },
    {
      label: "Ваш доход",
      value: `${formatPrice(stats.sellerRevenue)} ₽`,
      sub: `Всего ${formatPrice(stats.totalRevenue)} ₽ (−15% комиссия)`,
      icon: TrendingUp,
      color: "text-emerald-400 bg-emerald-500/10",
      glow: "bg-emerald-500/10",
    },
    {
      label: "Выплачено",
      value: `${formatPrice(stats.totalPaidOut)} ₽`,
      sub: "Завершённые выплаты",
      icon: Wallet,
      color: "text-amber-400 bg-amber-500/10",
      glow: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-violet-500/20"
          >
            <div
              className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-all ${card.glow}`}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
