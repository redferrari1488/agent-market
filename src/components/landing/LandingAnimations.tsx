"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const AUTOPLAY_MS = 4600;

function ProcessTabs() {
  const [active, setActive] = useState(0);

  function handleClick(i: number) {
    setActive(i);
  }

  function advance() {
    setActive((i) => (i + 1) % processSteps.length);
  }

  const Mock = PROCESS_MOCKS[active];

  return (
    <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
      {/* Step navigator */}
      <div>
        {/* Top meta row — step counter + autoplay progress */}
        <div className="mb-5 flex items-center gap-4">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/60 tabular-nums">
            {String(active + 1).padStart(2, "0")} / {String(processSteps.length).padStart(2, "0")}
          </span>
          <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-border/30">
            <motion.div
              key={`progress-${active}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
              onAnimationComplete={advance}
              className="absolute inset-0 origin-left rounded-full bg-primary/70"
              style={{ willChange: "transform" }}
            />
          </div>
        </div>

        <div className="relative">
          {/* Continuous muted spine spanning the whole navigator, softly faded at both ends */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[6.5px] top-0 bottom-0 w-[1px] bg-border/40"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
            }}
          />

            {processSteps.map((s, i) => {
            const isActive = i === active;
            const isLast = i === processSteps.length - 1;
            const NODE_CENTER = 32;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => handleClick(i)}
                className={`group relative block w-full py-6 text-left ${
                  !isLast ? "border-b border-border/20" : ""
                }`}
              >
              {/* Active spine highlight — full row, morphs between rows via layoutId */}
              {isActive && (
                <motion.span
                  layoutId="process-active-spine"
                  aria-hidden
                  className="pointer-events-none absolute left-[5px] w-[3px] rounded-full bg-primary"
                  style={{ top: "14px", bottom: "14px" }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                />
              )}
              {/* Inactive node — tiny tinted dot */}
              {!isActive && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[3px] h-[7px] w-[7px] rounded-full bg-border/70 transition-all duration-500 group-hover:scale-110 group-hover:bg-muted-foreground/70"
                  style={{ top: `${NODE_CENTER - 3}px` }}
                />
              )}
              {/* Active node — morphs between rows */}
              {isActive && (
                <motion.span
                  layoutId="process-active-node"
                  aria-hidden
                  className="pointer-events-none absolute left-0 flex h-[13px] w-[13px] items-center justify-center rounded-full border-2 border-primary bg-background"
                  style={{ top: `${NODE_CENTER - 6}px` }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, ease: heroEase }}
                    className="block h-[5px] w-[5px] rounded-full bg-primary"
                  />
                </motion.span>
              )}

              {/* Content */}
              <div className="pl-12">
                <h3
                  className={`text-[1.6rem] font-bold leading-[1.08] tracking-[-0.025em] transition-colors duration-500 sm:text-[2rem] ${
                    isActive
                      ? "text-foreground"
                      : "text-primary/[0.22] group-hover:text-primary/50"
                  }`}
                >
                  {s.title}
                </h3>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      key="desc"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        height: { duration: 0.5, ease: heroEase },
                        opacity: { duration: 0.4, delay: 0.15, ease: heroEase },
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="mt-3.5 max-w-md text-[15px] leading-[1.6] text-foreground/70 sm:text-[15.5px]">
                        {s.desc}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mock */}
      <div className="relative min-h-[360px] sm:min-h-[420px] lg:min-h-[460px] lg:max-w-[580px] lg:justify-self-end lg:self-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={`mock-${active}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: heroEase }}
            style={{ willChange: "opacity" }}
          >
            <Mock />
          </motion.div>
        </AnimatePresence>
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
      <section id="how" className="mt-28 scroll-mt-24 sm:mt-40">
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
