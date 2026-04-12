import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";

export const metadata: Metadata = {
  title: "AgentMarket — маркетплейс рабочих AI-агентов",
  description:
    "Готовые агенты для бизнеса. Поддержка клиентов, контент, мониторинг. Выбери, настрой, запусти — работает в Docker 24/7.",
  openGraph: {
    title: "AgentMarket — маркетплейс рабочих AI-агентов",
    description:
      "Готовые агенты для бизнеса. Выбери, настрой, запусти — работает в Docker 24/7.",
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
      {/* ===== HERO: product-centered ===== */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pt-16 sm:pt-24 lg:pt-28">
          {/* Tight centered copy */}
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Маркетплейс агентов
            </p>
            <h1 className="mt-4 text-[2.75rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[3.5rem] lg:text-[4.25rem]">
              Запускайте рабочих агентов,
              <br className="hidden sm:block" />{" "}
              <span className="text-muted-foreground">не написав ни строчки.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
              Каталог готовых Docker-агентов. Поддержка, контент, мониторинг.
              Выберите, настройте, запустите — работает 24/7.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/agents"
                className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Каталог
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#how"
                className="inline-flex h-11 items-center px-4 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Как это работает
              </Link>
            </div>
          </div>

          {/* Product mock — full-width, the hero IS the product */}
          <div className="mt-12 sm:mt-16">
            <HeroDashboardMock />
          </div>
        </div>
      </section>

      {/* ===== PROCESS — dense horizontal strip ===== */}
      <section id="how" className="mt-20 border-y border-border/40 sm:mt-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-border/40">
            {[
              { n: "01", title: "Выберите", desc: "Каталог агентов по категориям — поддержка, контент, мониторинг, аналитика." },
              { n: "02", title: "Настройте", desc: "Укажите Telegram-бот, API-ключи и параметры. Визард проведёт через каждый шаг." },
              { n: "03", title: "Запустите", desc: "Агент работает в Docker-контейнере. Логи, статус и управление — из дашборда." },
            ].map((s) => (
              <div key={s.n} className="py-8 sm:px-8 sm:py-10 sm:first:pl-0 sm:last:pr-0">
                <span className="font-mono text-[11px] text-muted-foreground/50">{s.n}</span>
                <h3 className="mt-2 text-[18px] font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORM — asymmetric, not a grid ===== */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="py-20 sm:py-28">
          <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            {/* Left: big idea */}
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Инфраструктура
              </p>
              <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
                Не скрипт на VPS.
                <br />
                Полноценная платформа.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Каждый агент — изолированный Docker-контейнер с ограничениями
                по CPU и памяти. Конфиги зашифрованы AES-256. Управление через
                дашборд без SSH.
              </p>

              {/* Technical specs — dense, mono */}
              <div className="mt-8 rounded-lg border border-border/40 bg-card/50 p-5">
                <div className="space-y-3 font-mono text-[12px]">
                  {[
                    ["Изоляция", "Docker container per agent"],
                    ["Лимиты", "256 MB RAM, 0.5 CPU"],
                    ["Шифрование", "AES-256-GCM"],
                    ["Ключи", "BYOK — Anthropic / OpenAI"],
                    ["Restart policy", "unless-stopped"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-muted-foreground/60">{label}</span>
                      <span className="text-right text-foreground/80">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: capabilities list — not cards, just text */}
            <div className="lg:pt-14">
              <div className="space-y-8">
                {[
                  {
                    title: "Потоковые логи",
                    desc: "Вывод контейнера в реальном времени. Tail последних 100 строк, автообновление.",
                  },
                  {
                    title: "Управление из дашборда",
                    desc: "Запуск, остановка, перезапуск, перенастройка. Статус и ресурсы контейнера.",
                  },
                  {
                    title: "Маркетплейс для разработчиков",
                    desc: "Загрузите Docker-образ, настройте setup-схему и цену. Платформа берёт 15%.",
                  },
                  {
                    title: "Два платёжных провайдера",
                    desc: "YooKassa для РФ, Cryptomus для зарубежа. Юзер выбирает при оформлении.",
                  },
                ].map((f) => (
                  <div key={f.title} className="border-l-2 border-border/60 pl-5">
                    <h3 className="text-[15px] font-semibold">{f.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATALOG ===== */}
      {mappedAgents.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Каталог
                </p>
                <h2 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
                  Агенты
                </h2>
              </div>
              <Link
                href="/agents"
                className="hidden items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                Все агенты
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-10">
              <AgentGrid agents={mappedAgents} />
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/agents"
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                Все агенты →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== SELLER — horizontal, asymmetric ===== */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-[auto_1fr] lg:gap-20">
            {/* Left: the number */}
            <div className="text-center lg:text-left">
              <div className="text-[7rem] font-bold leading-none tracking-[-0.06em] text-foreground/10 sm:text-[9rem] lg:text-[11rem]">
                85
              </div>
              <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.15em] text-muted-foreground">
                процентов выручки — вам
              </div>
            </div>

            {/* Right: copy */}
            <div className="max-w-md">
              <h2 className="text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2rem]">
                Загрузите образ. Назначьте цену. Получайте деньги.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Мы берём на себя биллинг, деплой и инфраструктуру.
                Вы публикуете Docker-образ с setup-схемой — покупатели
                находят, настраивают и запускают ваш агент из каталога.
                Платформа удерживает 15%. Остальное — ваше.
              </p>
              <Link
                href="/seller"
                className="group mt-6 inline-flex items-center gap-2 text-[14px] font-medium transition-colors hover:text-foreground"
              >
                Стать продавцом
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
