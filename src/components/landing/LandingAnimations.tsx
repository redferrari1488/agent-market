"use client";

import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  KeyRound,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";
import { FadeIn, ScaleIn } from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";

const ease = [0.25, 1, 0.5, 1] as const;

const heroFacts = [
  {
    label: "Категории",
    value: "Поддержка, контент, аналитика, мониторинг",
  },
  {
    label: "Запуск",
    value: "Один кабинет вместо долгой ручной настройки",
  },
  {
    label: "Контроль",
    value: "Логи, статус и кнопки управления на месте",
  },
  {
    label: "Оплата",
    value: "Карта или криптовалюта - без отдельной переписки",
  },
];

const processSteps = [
  {
    n: "01",
    title: "Выбираете сценарий",
    desc: "В каталоге уже собраны продукты для поддержки, контента, аналитики и мониторинга. Покупатель выбирает не идею, а готовый формат работы.",
    note: "Без длинного брифа",
    icon: Search,
  },
  {
    n: "02",
    title: "Подключаете свои данные",
    desc: "Ключи, аккаунты и рабочие параметры вводятся в кабинете. Без пересылки доступов в чат и без ручной сборки по кускам.",
    note: "Несколько минут",
    icon: Settings2,
  },
  {
    n: "03",
    title: "Получаете рабочий кабинет",
    desc: "После запуска у покупателя остаются статус, история событий, логи и управление. Агент не исчезает после оплаты.",
    note: "Контроль внутри сайта",
    icon: Rocket,
  },
];

function HeroLine({
  children,
  i,
}: {
  children: React.ReactNode;
  i: number;
}) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pt-16 sm:pt-24 lg:pt-28">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-2xl">
              <HeroLine i={0}>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Agent Market
                </p>
              </HeroLine>
              <HeroLine i={1}>
                <h1 className="mt-4 max-w-[11ch] text-[3rem] font-bold leading-[0.98] tracking-[-0.05em] sm:text-[4rem] lg:text-[4.85rem]">
                  Запускаете готового агента.
                </h1>
              </HeroLine>
              <HeroLine i={2}>
                <h1 className="max-w-[11ch] text-[3rem] font-bold leading-[0.98] tracking-[-0.05em] text-muted-foreground sm:text-[4rem] lg:text-[4.85rem]">
                  Не проект на заказ.
                </h1>
              </HeroLine>
              <HeroLine i={3}>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
                  Поддержка, контент, аналитика, мониторинг. Покупатель выбирает
                  готовый сценарий, подключает свои ключи и управляет всем из
                  кабинета.
                </p>
              </HeroLine>
              <HeroLine i={4}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/agents"
                    className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Смотреть агентов
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="#how"
                    className="inline-flex h-11 items-center px-1 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Как это устроено
                  </Link>
                </div>
              </HeroLine>
            </div>

            <FadeIn y={40}>
              <div className="grid gap-px overflow-hidden rounded-lg border border-border/40 bg-border/40 sm:grid-cols-2">
                {heroFacts.map((fact) => (
                  <div key={fact.label} className="bg-background p-5">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
                      {fact.label}
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.95, delay: 0.65, ease }}
            className="mt-12 sm:mt-16"
          >
            <div className="rounded-xl shadow-2xl shadow-black/25">
              <HeroDashboardMock />
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="how"
        className="mt-20 border-t border-border/40 sm:mt-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
            <FadeIn y={40}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Путь покупателя
              </p>
              <h2 className="mt-3 max-w-md text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[2.75rem]">
                Три действия вместо долгой ручной настройки.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Покупатель не пишет длинный бриф и не ждёт неделями. Он проходит
                короткий маршрут и получает рабочий агентский кабинет.
              </p>
            </FadeIn>

            <div className="border-t border-border/40">
              {processSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <FadeIn key={step.n} y={32}>
                    <div className="grid gap-4 border-b border-border/40 py-6 sm:grid-cols-[74px_minmax(0,1fr)_180px] sm:py-8">
                      <div className="font-mono text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
                        {step.n}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </div>
                          <h3 className="text-[18px] font-semibold tracking-tight sm:text-[20px]">
                            {step.title}
                          </h3>
                        </div>
                        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                          {step.desc}
                        </p>
                      </div>
                      <div className="pt-1 font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground sm:text-right">
                        {step.note}
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-12 py-20 sm:py-28 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <FadeIn y={40}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                После запуска
              </p>
              <h2 className="mt-3 max-w-md text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[2.75rem]">
                У покупателя остаётся кабинет, а не пустая витрина.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Агент работает сам, но не исчезает из поля зрения. Видно
                состояние, историю событий и управление - без лишней ручной
                рутины.
              </p>
            </FadeIn>

            <FadeIn y={40}>
              <div className="grid gap-px overflow-hidden rounded-lg border border-border/40 bg-border/40 sm:grid-cols-2">
                <div className="bg-background p-6 sm:col-span-2">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
                    Кабинет
                  </div>
                  <h3 className="mt-4 text-[22px] font-semibold tracking-tight">
                    Видно, что происходит прямо сейчас
                  </h3>
                  <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                    Статус, логи и действия собраны в одном месте. После оплаты
                    покупатель не остаётся один на один с интерфейсом.
                  </p>
                  <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-border/40 bg-border/40 sm:grid-cols-3">
                    {[
                      ["Статус", "running"],
                      ["Логи", "live output"],
                      ["Действия", "stop / restart"],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-card/40 p-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                          {label}
                        </div>
                        <div className="mt-2 text-[13px] font-medium text-foreground/90">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-background p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-[18px] font-semibold tracking-tight">
                    Свои ключи и доступы
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    Покупатель подключает собственные рабочие данные и не зависит
                    от чужого аккаунта.
                  </p>
                </div>

                <div className="bg-background p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-[18px] font-semibold tracking-tight">
                    Понятная подписка
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    Карта или криптовалюта. Без отдельной переписки про оплату и
                    без скрытых сценариев.
                  </p>
                </div>

                <div className="bg-background p-6 sm:col-span-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-[18px] font-semibold tracking-tight">
                    Агент работает как продукт, а не как разовая услуга
                  </h3>
                  <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                    У покупателя остаются история событий, понятный статус и
                    управление. Это не разовая выдача файла и не письмо с
                    инструкцией - это рабочий сервис внутри сайта.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {agents.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
            <FadeIn y={40}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Каталог
                  </p>
                  <h2 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
                    Готовые агенты
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
            </FadeIn>

            <div className="mt-10">
              <AgentGrid agents={agents} animated />
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

      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <FadeIn y={40}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Продавцам
              </p>
              <h2 className="mt-3 max-w-md text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[2.75rem]">
                Публикуете агента один раз.
              </h2>
              <h2 className="max-w-md text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] text-muted-foreground sm:text-[2.75rem]">
                Дальше продаёт площадка.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Вы загружаете продукт, назначаете цену и получаете свою долю.
                Каталог, оплата и понятный путь покупателя уже собраны на одной
                стороне.
              </p>

              <div className="mt-8 flex flex-wrap gap-8 border-t border-border/40 pt-6">
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
                    Ваша доля
                  </div>
                  <div className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground">
                    88%
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
                    Комиссия платформы
                  </div>
                  <div className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.03em] text-muted-foreground">
                    12%
                  </div>
                </div>
              </div>

              <Link
                href="/seller"
                className="group mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Стать продавцом
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </FadeIn>

            <ScaleIn>
              <div className="relative mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-xl border border-border/40 bg-card/50 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold tracking-tight">
                          Выплата
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground/60">
                          MAR 2026
                        </div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      Выплачено
                    </span>
                  </div>

                  <div className="px-5 py-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[2.5rem] font-bold leading-none tracking-[-0.03em]">
                        146 960
                      </span>
                      <span className="text-[14px] text-muted-foreground">
                        ₽
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +24% к февралю
                    </div>
                  </div>

                  <div className="space-y-2.5 border-t border-border/40 px-5 py-4 font-mono text-[11.5px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/70">
                        Ваша часть
                      </span>
                      <span className="text-foreground/90">167 000 ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/70">
                        Комиссия (12%)
                      </span>
                      <span className="text-muted-foreground/60">−20 040 ₽</span>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-2.5 text-foreground">
                      <span className="font-semibold">К выплате</span>
                      <span className="font-semibold">146 960 ₽</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 bg-card/50 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
                    <span>Продаж · 47</span>
                    <span>Активных · 31</span>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>
    </>
  );
}
