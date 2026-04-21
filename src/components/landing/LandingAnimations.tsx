"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, TrendingUp, Upload, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";
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
      className="relative inline-flex max-w-full overflow-hidden align-bottom pb-[0.22em] pt-[0.05em]"
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

const SELLER_STEPS = [
  {
    icon: Upload,
    title: "Публикация",
    desc: "Загружаете агента, описание и цену в кабинете продавца.",
  },
  {
    icon: ShieldCheck,
    title: "Модерация",
    desc: "Команда проверяет безопасность и описание за 1-2 дня.",
  },
  {
    icon: Wallet,
    title: "Выплаты",
    desc: "88% с каждой подписки приходит на ваш счёт автоматически.",
  },
];

function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.svg
      viewBox="0 0 88 14"
      className="hidden h-3 w-24 self-center text-border lg:block"
      aria-hidden
    >
      <motion.line
        x1="0"
        y1="7"
        x2="74"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray="2 5"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.7 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
      <motion.path
        d="M74 1.5 L86 7 L74 12.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 0.7, x: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.4, delay: delay + 0.7, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

function SellerFlow() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-start lg:gap-4">
      {SELLER_STEPS.map((step, i) => {
        const Icon = step.icon;
        const stepDelay = i * 0.18;
        return (
          <Fragment key={step.title}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: stepDelay, ease: heroEase }}
              className="flex flex-col items-start gap-5 lg:items-center lg:text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: stepDelay + 0.1, ease: heroEase }}
                className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-background"
              >
                <Icon className="h-5 w-5 text-foreground/80" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-[20px] font-semibold tracking-[-0.015em] sm:text-[22px]">
                  {step.title}
                </h3>
                <p className="max-w-[18rem] text-[14.5px] leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </motion.div>
            {i < SELLER_STEPS.length - 1 && (
              <FlowArrow delay={stepDelay + 0.35} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-5 sm:px-6">
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
              <a
                href="#how"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                · как стать продавцом
              </a>
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

      {/* SELLER FLOW */}
      <section id="how" className="mt-28 scroll-mt-24 sm:mt-40">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <FadeIn y={40}>
            <h2 className="max-w-3xl text-[2.25rem] font-bold leading-[1] tracking-[-0.04em] sm:text-[3.25rem] lg:text-[4rem]">
              Запустите своего <span className="text-primary">агента.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
              Три шага от загрузки до первой выплаты. Без созвонов и переписок.
            </p>
          </FadeIn>

          <div className="mt-16 sm:mt-20">
            <SellerFlow />
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

      {/* SELLER CTA */}
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
                          апрель 2026
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
                      +24% к маю
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
