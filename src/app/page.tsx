import Link from "next/link";
import type { Metadata } from "next";
import {
  Bot,
  Zap,
  Shield,
  ArrowRight,
  DollarSign,
  BarChart3,
  Globe,
  Sparkles,
  Clock,
  Lock,
} from "lucide-react";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";

export const metadata: Metadata = {
  title: "AgentMarket — Маркетплейс AI-агентов",
  description:
    "Готовые AI-агенты для бизнеса. Telegram-боты, генерация контента, мониторинг конкурентов. Выберите, подключите за 2 минуты — работает 24/7.",
  openGraph: {
    title: "AgentMarket — Маркетплейс AI-агентов",
    description:
      "Готовые AI-агенты для бизнеса. Выберите, подключите за 2 минуты — работает 24/7.",
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
      <section className="relative overflow-hidden">
        {/* Raycast-style conic beams radiating from behind the mock */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          {/* Base vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_75%_40%,rgba(139,92,246,0.18),transparent_65%)]" />
          {/* Conic beams — swept from a point on the right, masked to fade at edges */}
          <div
            className="absolute right-[-10%] top-[10%] h-[900px] w-[900px] opacity-60"
            style={{
              background:
                "conic-gradient(from 200deg at 50% 50%, transparent 0deg, rgba(139,92,246,0.35) 20deg, transparent 40deg, rgba(59,130,246,0.25) 70deg, transparent 95deg, rgba(139,92,246,0.18) 130deg, transparent 160deg, transparent 360deg)",
              WebkitMaskImage:
                "radial-gradient(closest-side, black 20%, transparent 75%)",
              maskImage:
                "radial-gradient(closest-side, black 20%, transparent 75%)",
              filter: "blur(40px)",
            }}
          />
          {/* Subtle grid overlay for "real product" feel */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent 80%)",
              maskImage:
                "radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent 80%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI-автоматизация для бизнеса
              </div>

              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
                Агенты, которые{" "}
                <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  работают
                </span>{" "}
                пока вы спите.
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0">
                Готовые AI-решения в Docker-контейнерах. Поддержка клиентов, генерация контента,
                мониторинг конкурентов — подключите за 2 минуты.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  href="/agents"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
                >
                  Смотреть каталог
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/seller"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-border/50 bg-white/5 px-7 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  Для продавцов
                </Link>
              </div>

              {/* Stats row */}
              <div className="mt-12 flex items-center justify-center gap-8 sm:gap-12 lg:justify-start">
                {[
                  { value: "24/7", label: "Работа агентов" },
                  { value: "2 мин", label: "Настройка" },
                  { value: "85%", label: "Продавцу" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: live dashboard mock */}
            <div className="lg:pl-4">
              <HeroDashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — Bento Grid ===== */}
      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-violet-950/5 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Как это работает</h2>
            <p className="mt-3 text-muted-foreground">Три шага от выбора до результата</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 — large */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-8 transition-colors hover:border-violet-500/30">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-500/5 blur-2xl transition-all group-hover:bg-violet-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="mt-1 text-xs text-violet-400/80">Шаг 1</div>
                <h3 className="mt-3 text-xl font-bold">Выберите агента</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  Каталог готовых AI-решений для поддержки, контента, аналитики и мониторинга.
                  Каждый агент — рабочая система в Docker.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-8 transition-colors hover:border-blue-500/30">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl transition-all group-hover:bg-blue-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="mt-1 text-xs text-blue-400/80">Шаг 2</div>
                <h3 className="mt-3 text-xl font-bold">Настройте за 2 минуты</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  Setup Wizard проведёт вас через настройку. Укажите токены и параметры —
                  агент готов к запуску.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-8 transition-colors hover:border-emerald-500/30 sm:col-span-2 lg:col-span-1">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="mt-1 text-xs text-emerald-400/80">Шаг 3</div>
                <h3 className="mt-3 text-xl font-bold">Работает 24/7</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  Агент запускается в облаке и работает автономно. Логи, контроль и перезапуск
                  прямо из дашборда.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES BENTO ===== */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Почему AgentMarket</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
              <Clock className="h-5 w-5 text-violet-400" />
              <h3 className="mt-3 font-bold">Мгновенный старт</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Не нужно писать код. Выберите агента, введите параметры — работает.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
              <Lock className="h-5 w-5 text-blue-400" />
              <h3 className="mt-3 font-bold">Безопасность</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Конфиги зашифрованы AES-256-GCM. Ваши ключи и токены под защитой.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <h3 className="mt-3 font-bold">Полный контроль</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Логи в реальном времени, старт/стоп, перенастройка из дашборда.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
              <Globe className="h-5 w-5 text-amber-400" />
              <h3 className="mt-3 font-bold">Два рынка</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Оплата картой (YooKassa) или криптой (Cryptomus) — для РФ и зарубежа.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== POPULAR AGENTS ===== */}
      {mappedAgents.length > 0 && (
        <section className="relative border-t border-border/50">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-violet-950/5 to-transparent" />
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold sm:text-4xl">Популярные агенты</h2>
                <p className="mt-2 text-muted-foreground">Проверенные решения с лучшим рейтингом</p>
              </div>
              <Link
                href="/agents"
                className="hidden items-center gap-1 text-sm text-violet-400 hover:text-violet-300 sm:flex"
              >
                Все агенты
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <AgentGrid agents={mappedAgents} />
            <div className="mt-6 text-center sm:hidden">
              <Link href="/agents" className="text-sm text-violet-400 hover:text-violet-300">
                Все агенты →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== SELLER CTA ===== */}
      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Создавайте.{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                Продавайте.
              </span>{" "}
              Зарабатывайте.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Загрузите Docker-образ, настройте цену — мы возьмём на себя биллинг, деплой и
              инфраструктуру. Вы получаете 85% с каждого платежа.
            </p>

            <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  title: "85% выручки",
                  desc: "Комиссия — всего 15%",
                  color: "text-emerald-400 bg-emerald-500/10",
                },
                {
                  icon: BarChart3,
                  title: "Аналитика",
                  desc: "Продажи и подписки",
                  color: "text-blue-400 bg-blue-500/10",
                },
                {
                  icon: Globe,
                  title: "Глобально",
                  desc: "РФ + зарубеж",
                  color: "text-violet-400 bg-violet-500/10",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/50 bg-card/50 p-5 text-center"
                >
                  <div
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/seller"
              className="group mt-10 inline-flex h-12 items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-7 text-sm font-bold text-violet-300 transition-all hover:bg-violet-500/20"
            >
              Стать продавцом
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
