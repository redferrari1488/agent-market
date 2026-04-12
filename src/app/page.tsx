import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Terminal,
  Settings,
  Play,
  Lock,
  BarChart3,
  Layers,
} from "lucide-react";
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
      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pb-16 pt-16 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            {/* Copy */}
            <div className="max-w-xl pt-2">
              <h1 className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
                Готовые агенты для бизнеса
              </h1>
              <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
                Каталог рабочих AI-агентов в Docker-контейнерах.
                Поддержка клиентов, генерация контента, мониторинг конкурентов.
                Выберите, настройте, запустите. Работает 24/7 без вашего участия.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/agents"
                  className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
                >
                  Смотреть каталог
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/seller"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-[14px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  Продавать агентов
                </Link>
              </div>

              {/* Numbers */}
              <div className="mt-12 flex gap-10">
                {[
                  { value: "24/7", sub: "Агенты работают непрерывно" },
                  { value: "2 мин", sub: "Время настройки" },
                  { value: "85%", sub: "Выручки продавцу" },
                ].map((s) => (
                  <div key={s.value}>
                    <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product mock */}
            <div className="lg:mt-0">
              <HeroDashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <div className="max-w-lg">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Как это работает</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Три шага от каталога до работающего агента.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border/40 bg-border/40 sm:grid-cols-3">
            {[
              {
                icon: Terminal,
                step: "01",
                title: "Выберите из каталога",
                desc: "Каждый агент — рабочая система в Docker-контейнере. Поддержка, контент, аналитика, мониторинг.",
              },
              {
                icon: Settings,
                step: "02",
                title: "Настройте параметры",
                desc: "Укажите Telegram-бот, API-ключи, расписание. Визард проведёт через каждый шаг.",
              },
              {
                icon: Play,
                step: "03",
                title: "Запустите и контролируйте",
                desc: "Агент работает в облаке. Логи, статус, перезапуск и перенастройка — из дашборда.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-background p-8">
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[12px] font-medium text-muted-foreground/50">{item.step}</span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORM ===== */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <div className="max-w-lg">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Платформа</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Не голый скрипт, а полноценная инфраструктура для запуска и управления.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Play,
                title: "Docker-изоляция",
                desc: "Каждый агент — отдельный контейнер с лимитами CPU и RAM. Не влияет на остальных.",
              },
              {
                icon: Lock,
                title: "Шифрование конфигов",
                desc: "API-ключи и токены зашифрованы AES-256-GCM. Расшифровка только в момент деплоя.",
              },
              {
                icon: BarChart3,
                title: "Логи и мониторинг",
                desc: "Потоковые логи, статус контейнера, ресурсы. Всё в реальном времени из дашборда.",
              },
              {
                icon: Terminal,
                title: "BYOK-модель",
                desc: "Используете свои API-ключи Anthropic или OpenAI. Без наценки на токены.",
              },
              {
                icon: Layers,
                title: "Маркетплейс",
                desc: "Сторонние разработчики могут продавать своих агентов. Платформа берёт 15%.",
              },
              {
                icon: Settings,
                title: "Полный контроль",
                desc: "Запуск, остановка, перезапуск, перенастройка. Без SSH и командной строки.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border/40 p-6 transition-colors hover:border-border"
              >
                <f.icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AGENTS ===== */}
      {mappedAgents.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Каталог</h2>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  Готовые решения, которые можно запустить сейчас.
                </p>
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

      {/* ===== SELLER CTA ===== */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <div className="rounded-xl border border-border/40 p-8 sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Продавайте агентов
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Загрузите Docker-образ, настройте цену. Платформа берёт на себя
                биллинг, деплой и инфраструктуру. Вы получаете 85% с каждой продажи.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-center">
                {[
                  { value: "85%", label: "Выручки вам" },
                  { value: "15%", label: "Комиссия платформы" },
                  { value: "0 ₽", label: "За размещение" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              <Link
                href="/seller"
                className="group mt-8 inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-[14px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
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
