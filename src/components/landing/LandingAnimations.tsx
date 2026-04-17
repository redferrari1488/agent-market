"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";
import { PROCESS_MOCKS } from "@/components/landing/ProcessTabMocks";
import { FadeIn, ScaleIn } from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";

const heroEase = [0.16, 1, 0.3, 1] as const;

const ROTATING_WORDS = ["Поддержка", "Контент", "Аналитика", "Мониторинг", "И всё что вы захотите"];

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="relative inline-flex overflow-hidden align-bottom pb-[0.22em] pt-[0.05em]"
      style={{ minWidth: "5ch" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING_WORDS[index]}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.45, ease: heroEase }}
          className="text-primary tracking-[-0.015em]"
        >
          {ROTATING_WORDS[index]}{index === ROTATING_WORDS.length - 1 && <span className="text-primary">.</span>}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
        initial={{ y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.3, delay, ease: heroEase }}
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
    bullets: ["Категории и фильтры", "Рейтинг и отзывы", "Прозрачные цены"],
  },
  {
    n: "02",
    title: "Подключаете",
    desc: "Ключи и рабочие параметры вводятся в кабинете. Без пересылки доступов в чат и ручной сборки по кускам.",
    bullets: ["Пошаговый мастер", "Шифрование AES-256", "Только ваши данные"],
  },
  {
    n: "03",
    title: "Работает",
    desc: "После запуска агент живёт в кабинете. Статус, история событий, логи и управление - всё под рукой.",
    bullets: ["Логи реального времени", "Метрики и статус", "Стоп и перезапуск"],
  },
];

function ProcessTabs() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startAutoplay() {
    intervalRef.current = setInterval(() => {
      setActive((i) => (i + 1) % processSteps.length);
    }, 4000);
  }

  function stopAutoplay() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, []);

  function handleClick(i: number) {
    setActive(i);
    stopAutoplay();
    startAutoplay();
  }

  const step = processSteps[active];
  const Mock = PROCESS_MOCKS[active];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border/40">
        {processSteps.map((s, i) => (
          <button
            key={s.n}
            type="button"
            onClick={() => handleClick(i)}
            className={`relative flex-1 py-5 text-center transition-colors ${
              i === active ? "text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            <span className="text-[13px] font-bold uppercase tracking-[0.04em] sm:text-[15px]">
              {s.title}
            </span>
            {i === active && (
              <motion.div
                layoutId="process-tab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-12 pt-12 sm:pt-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${active}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: heroEase }}
          >
            <p className="max-w-lg text-[17px] leading-[1.55] text-foreground/85 sm:text-[19px]">
              {step.desc}
            </p>
            <ul className="mt-8 flex flex-col gap-3.5">
              {step.bullets.map((b, bi) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + bi * 0.08, ease: heroEase }}
                  className="flex items-center gap-3.5 text-[15px] tracking-[-0.005em] text-foreground/85 sm:text-[15.5px]"
                >
                  <span className="h-px w-3.5 shrink-0 bg-foreground/35" />
                  {b}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        <div className="relative lg:min-h-[460px] lg:max-w-[580px] lg:justify-self-end">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`mock-${active}`}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.65, ease: heroEase }}
              style={{ willChange: "transform, opacity" }}
            >
              <Mock />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-10 flex gap-2">
        {processSteps.map((_, i) => (
          <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-border/40">
            {i === active && (
              <motion.div
                key={`bar-${active}`}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-full bg-primary/60"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-5 sm:px-6">
        {/* Subtle dot grid background */}
        <div
          className="pointer-events-none absolute inset-0 -top-14 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative pt-20 sm:pt-28 lg:pt-32">
          <HeroReveal delay={0.1}>
            <h1 className="text-[2rem] font-bold leading-[0.94] tracking-[-0.05em] sm:text-[4.5rem] lg:text-[5.75rem]">
              AI-агенты для бизнеса.
            </h1>
          </HeroReveal>

          <HeroReveal delay={0.25}>
            <div className="mt-2 text-[2rem] font-bold leading-[0.94] tracking-[-0.05em] sm:text-[4.5rem] lg:text-[5.75rem]">
              <RotatingWord />
            </div>
          </HeroReveal>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.55, ease: heroEase }}
            className="mt-6 h-px origin-left bg-border/40"
          />

          <motion.p
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.75, ease: heroEase }}
            className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]"
          >
            Поддержка, контент, аналитика, мониторинг - и любая другая задача
            бизнеса. Подключаете свои ключи и запускаете за несколько минут.
          </motion.p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.05, ease: heroEase }}
            >
              <BracketLink href="/agents" label="смотреть агентов" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.15, ease: heroEase }}
            >
              <Link
                href="#how"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                · как это устроено
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.85, ease: heroEase }}
          className="relative mt-16 sm:mt-20"
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

          <div className="mt-14">
            <ProcessTabs />
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
