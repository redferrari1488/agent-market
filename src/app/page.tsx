import Link from "next/link";
import { Bot, Zap, Shield, ArrowRight, DollarSign, BarChart3, Globe } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import { AgentGrid } from "@/components/agents/AgentGrid";

export default async function Home() {
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
      <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        {/* Тонкое свечение — единственный градиент на странице */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            AI-агенты, которые работают за вас
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Не промпты, а готовые системы. Выберите агента, подключите за 5 минут — он работает 24/7 в облаке.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/agents"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Смотреть агентов
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/seller"
              className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Стать продавцом
            </Link>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Как это работает
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Три шага до работающего AI-агента
          </p>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
            {[
              {
                icon: Bot,
                step: "1",
                title: "Выберите агента",
                description: "Каталог проверенных AI-агентов для разных задач.",
              },
              {
                icon: Zap,
                step: "2",
                title: "Подключите за 5 минут",
                description: "Укажите токены и настройки в простой форме.",
              },
              {
                icon: Shield,
                step: "3",
                title: "Работает 24/7",
                description: "Агент в облаке. Логи и управление в дашборде.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col bg-background p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-bold text-muted-foreground">
                  {item.step}
                </div>
                <h3 className="text-sm font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Популярные агенты */}
      {agents && agents.length > 0 && (
        <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Популярные агенты
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Проверенные решения, которые уже работают
                </p>
              </div>
              <Link
                href="/agents"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                Все агенты
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8">
              <AgentGrid agents={agents} />
            </div>
          </div>
        </section>
      )}

      {/* Для прода��цов */}
      <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border p-8 sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Продавайте своих AI-агентов
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Публикуйте агентов на маркетплейсе. Хостинг и биллинг на нас — вы получаете 75% с каждой подписки.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  title: "75% выручки",
                  description: "Комиссия 25%. Выплаты через Stripe Connect.",
                },
                {
                  icon: Globe,
                  title: "Аудитория с первого дня",
                  description: "Агент сразу виден покупателям в каталоге.",
                },
                {
                  icon: BarChart3,
                  title: "Аналитик��",
                  description: "Статистика продаж и графики выручки.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col bg-background p-5"
                >
                  <item.icon className="mb-2 h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/seller"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
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
