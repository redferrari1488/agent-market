import Link from "next/link";
import { Bot, Zap, Shield, ArrowRight, DollarSign, BarChart3, Globe } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import { AgentGrid } from "@/components/agents/AgentGrid";

export default async function Home() {
  // Популярные агенты из БД
  const supabase = await createServerClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("id, slug, name, description, category, price_monthly, rating_avg, rating_count, purchases_count, features, status")
    .eq("status", "published")
    .order("purchases_count", { ascending: false })
    .limit(6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AI-агенты, которые{" "}
            <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
              работают за вас
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            Не промпты, а готовые системы. Выберите агента, подключите за 5 минут —
            он работает 24/7 в облаке. Поддержка клиентов, генерация контента,
            мониторинг конкурентов и другое.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/agents"
              className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 text-sm font-medium text-white transition-all hover:from-violet-700 hover:to-blue-600"
            >
              Смотреть агентов
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/seller"
              className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Стать продавцом
            </Link>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="border-t border-border/50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Как это работает
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Три простых шага до работающего AI-агента
          </p>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Bot,
                step: "01",
                title: "Выберите агента",
                description:
                  "Каталог проверенных AI-агентов для разных задач. Каждый протестирован и готов к работе.",
              },
              {
                icon: Zap,
                step: "02",
                title: "Подключите за 5 минут",
                description:
                  "Укажите токены и настройки в простой форме. Никакого кода — всё через визуальный интерфейс.",
              },
              {
                icon: Shield,
                step: "03",
                title: "Работает 24/7",
                description:
                  "Агент запускается в облаке и работает автономно. Логи, статистика и управление в дашборде.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-violet-600/50"
              >
                <div className="mb-4 text-sm font-bold text-violet-500">
                  {item.step}
                </div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/10 to-blue-500/10">
                  <item.icon className="h-5 w-5 text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Популярные агенты */}
      {agents && agents.length > 0 && (
        <section className="border-t border-border/50 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Популярные агенты
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Проверенные решения, которые уже работают у сотен пользователей
                </p>
              </div>
              <Link
                href="/agents"
                className="hidden items-center gap-1 text-sm font-medium text-violet-500 hover:text-violet-400 sm:flex"
              >
                Все агенты
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10">
              <AgentGrid agents={agents} />
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/agents"
                className="inline-flex items-center gap-1 text-sm font-medium text-violet-500"
              >
                Смотреть все
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Для продавцов */}
      <section className="border-t border-border/50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-violet-600/5 to-blue-500/5 p-8 sm:p-12 lg:p-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Продавайте своих AI-агентов
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Публикуйте агентов на маркетплейсе. Мы берём на себя хостинг, биллинг
                и поддержку — вы получаете 75% с каждой подписки.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  title: "75% выручки — вам",
                  description:
                    "Прозрачная комиссия 25%. Выплаты через Stripe Connect напрямую на ваш счёт.",
                },
                {
                  icon: Globe,
                  title: "Аудитория с первого дня",
                  description:
                    "Не нужно строить маркетинг с нуля. Ваш агент сразу виден покупателям в каталоге.",
                },
                {
                  icon: BarChart3,
                  title: "Аналитика и контроль",
                  description:
                    "Панель продавца: статистика продаж, графики выручки, управление агентами.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/50 bg-card/50 p-5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10">
                    <item.icon className="h-5 w-5 text-violet-500" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/seller"
                className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-6 text-sm font-medium text-white transition-all hover:from-violet-700 hover:to-blue-600"
              >
                Начать продавать
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
