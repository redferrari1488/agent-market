"use client";

import Link from "next/link";
import { ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";
import { FadeIn, ScaleIn } from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";

const ease = [0.25, 1, 0.5, 1] as const;

function HeroReveal({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "105%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay, ease }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function BracketLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 font-mono text-[12.5px] text-foreground transition-colors hover:text-primary ${className}`}
    >
      <span className="text-primary">[</span>
      <span className="uppercase tracking-[0.12em]">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      <span className="text-primary">]</span>
    </Link>
  );
}

const processSteps = [
  {
    n: "01",
    title: "Выбираете",
    desc: "В каталоге уже собраны сценарии: поддержка, контент, аналитика, мониторинг. Не идея, а готовый формат работы.",
  },
  {
    n: "02",
    title: "Подключаете",
    desc: "Ключи и рабочие параметры вводятся в кабинете. Без пересылки доступов в чат и ручной сборки по кускам.",
  },
  {
    n: "03",
    title: "Работает",
    desc: "После запуска агент живёт в кабинете. Статус, история событий, логи и управление - всё под рукой.",
  },
];

const cabinetBullets = [
  {
    title: "Свои ключи и доступы",
    desc: "Подключаете собственные аккаунты. Нет зависимости от чужих данных.",
  },
  {
    title: "Понятная подписка",
    desc: "Карта или криптовалюта. Без отдельной переписки и скрытых сценариев.",
  },
  {
    title: "Рабочий сервис",
    desc: "История событий, статус и управление остаются с вами после оплаты.",
  },
];

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pt-20 sm:pt-28 lg:pt-32">
          <HeroReveal delay={0.1}>
            <h1 className="text-[2.75rem] font-bold leading-[0.94] tracking-[-0.05em] sm:text-[4.5rem] lg:text-[5.75rem]">
              Готовые <span className="text-primary">AI-агенты.</span>
            </h1>
          </HeroReveal>

          <HeroReveal delay={0.28}>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
              Поддержка, контент, аналитика, мониторинг. Подключаете свои
              ключи и запускаете за несколько минут.
            </p>
          </HeroReveal>

          <HeroReveal delay={0.42}>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <BracketLink href="/agents" label="смотреть агентов" />
              <Link
                href="#how"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                · как это устроено
              </Link>
            </div>
          </HeroReveal>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease }}
          className="mt-16 sm:mt-20"
        >
          <HeroDashboardMock />
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mt-28 sm:mt-40">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <FadeIn y={40}>
            <h2 className="max-w-3xl text-[2.25rem] font-bold leading-[1] tracking-[-0.04em] sm:text-[3.25rem] lg:text-[4rem]">
              От выбора <span className="text-primary">до запуска.</span>
            </h2>
          </FadeIn>

          <div className="mt-14 grid gap-px overflow-hidden rounded-xl bg-border/40 sm:grid-cols-3">
            {processSteps.map((step) => (
              <FadeIn key={step.n} y={40}>
                <div className="flex h-full flex-col bg-background p-8 sm:p-10">
                  <div className="font-mono text-[72px] font-bold leading-[0.9] text-primary/75 sm:text-[96px]">
                    {step.n}
                  </div>
                  <h3 className="mt-10 text-[22px] font-semibold tracking-tight sm:text-[26px]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* POST LAUNCH */}
      <section className="mt-28 sm:mt-40">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
            <FadeIn y={40}>
              <h2 className="max-w-md text-[2.25rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[3.25rem]">
                Агент не исчезает{" "}
                <span className="text-primary">после оплаты.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Видно, что происходит прямо сейчас: статус, история событий,
                логи, кнопки управления. Рабочий сервис, а не разовая выдача
                файла.
              </p>
            </FadeIn>

            <FadeIn y={40}>
              <div className="rounded-xl border border-border/60 bg-background p-8 sm:p-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
                      Кабинет
                    </div>
                    <h3 className="mt-3 text-[22px] font-semibold tracking-tight sm:text-[26px]">
                      Контроль в одном месте
                    </h3>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    running
                  </span>
                </div>

                <ul className="mt-8 space-y-5">
                  {cabinetBullets.map((bullet, i) => (
                    <li
                      key={bullet.title}
                      className={`flex gap-4 ${
                        i === 0 ? "" : "border-t border-border/40 pt-5"
                      }`}
                    >
                      <div className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <div>
                        <div className="text-[14px] font-medium text-foreground">
                          {bullet.title}
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                          {bullet.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      {agents.length > 0 && (
        <section className="mt-28 sm:mt-40">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <FadeIn y={40}>
              <div className="flex items-end justify-between gap-6">
                <h2 className="text-[2.25rem] font-bold tracking-[-0.03em] sm:text-[3rem]">
                  Каталог <span className="text-primary">агентов.</span>
                </h2>
                <Link
                  href="/agents"
                  className="hidden items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary sm:flex"
                >
                  все агенты
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>

            <div className="mt-12">
              <AgentGrid agents={agents} animated />
            </div>
          </div>
        </section>
      )}

      {/* SELLER */}
      <section className="mt-28 pb-28 sm:mt-40 sm:pb-40">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <FadeIn y={40}>
              <h2 className="max-w-md text-[2.25rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[3.25rem]">
                Публикуете один раз.{" "}
                <span className="text-primary">Продаёт площадка.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Загружаете продукт, назначаете цену, получаете 88% с каждой
                продажи. Каталог, оплата и путь покупателя уже собраны.
              </p>
              <div className="mt-10">
                <BracketLink href="/seller" label="стать продавцом" />
              </div>
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
                      <span className="text-muted-foreground/60">
                        −20 040 ₽
                      </span>
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
