import Link from "next/link";
import type { Metadata } from "next";
import { Bot, Zap, Shield, ArrowRight, DollarSign, BarChart3, Globe } from "lucide-react";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AgentGrid } from "@/components/agents/AgentGrid";

export const metadata: Metadata = {
  title: "AgentMarket — Маркетплейс AI-агентов",
  description:
    "Готовые AI-агенты для бизнеса. Telegram-боты, генерация контента, мониторинг конкурентов. Выберите, подключите за 2 минуты — работает 24/7.",
  openGraph: {
    title: "AgentMarket — Маркетплейс AI-агентов",
    description: "Готовые AI-агенты для бизнеса. Выберите, подключите за 2 минуты — работает 24/7.",
    type: "website",
  },
};

export default async function Home() {
  const topAgents = await db
    .select({
      id: agents.id,
      slug: agents.slug,
      name: agents.name,
      description: agents.description,
      category: agents.category,
      priceMonthly: agents.priceMonthly,
      ratingAvg: agents.ratingAvg,
      ratingCount: agents.ratingCount,
      purchasesCount: agents.purchasesCount,
      features: agents.features,
      status: agents.status,
    })
    .from(agents)
    .where(eq(agents.status, "published"))
    .orderBy(desc(agents.purchasesCount))
    .limit(3);

  // Маппим camelCase → snake_case для совместимости с AgentGrid
  const mappedAgents = topAgents.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category,
    price_monthly: a.priceMonthly,
    rating_avg: a.ratingAvg,
    rating_count: a.ratingCount,
    purchases_count: a.purchasesCount,
    features: a.features,
    status: a.status,
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AI-агенты, которые{" "}
              <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
                работают за вас
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Готовые автоматизации для бизнеса. Выберите агента, подключите за 2 минуты — он работает 24/7.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/agents"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Смотреть каталог
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/seller"
                className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Для продавцов
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Как это работает</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Bot, title: "Выберите агента", desc: "Каталог готовых AI-решений для разных задач бизнеса." },
              { icon: Zap, title: "Настройте за 2 минуты", desc: "Введите токены и параметры — Setup Wizard проведёт." },
              { icon: Shield, title: "Работает 24/7", desc: "Агент запускается в облаке и работает автономно." },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border border-border p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Популярные агенты */}
      {mappedAgents.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold sm:text-3xl">Популярные агенты</h2>
              <Link href="/agents" className="text-sm text-primary hover:underline">
                Все агенты
              </Link>
            </div>
            <div className="mt-8">
              <AgentGrid agents={mappedAgents} />
            </div>
          </div>
        </section>
      )}

      {/* Секция для продавцов */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Продавайте своих агентов</h2>
            <p className="mt-3 text-muted-foreground">
              Создайте AI-агента, загрузите Docker-образ, настройте цену — мы возьмём на себя биллинг, деплой и поддержку инфраструктуры.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: DollarSign, title: "85% выручки", desc: "Комиссия платформы — всего 15%" },
                { icon: BarChart3, title: "Аналитика", desc: "Статистика продаж и подписок" },
                { icon: Globe, title: "Два рынка", desc: "РФ (YooKassa) + зарубеж (крипта)" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border p-4">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-2 font-bold text-sm">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link
              href="/seller"
              className="mt-8 inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-secondary"
            >
              Стать продавцом
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
