"use client";

import Link from "next/link";
import { ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroAgentGrid } from "@/components/landing/HeroAgentGrid";
import { ProcessTabsScroll } from "@/components/landing/ProcessTabsScroll";
import { FadeIn, ScaleIn } from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";

const heroEase = [0.16, 1, 0.3, 1] as const;

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

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      {/* HERO */}
      <div className="relative overflow-x-clip">
        <section className="relative mx-auto max-w-6xl px-5 sm:px-6">
        {/* Subtle dot grid background */}
        <div
          className="pointer-events-none absolute inset-0 -top-14 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative grid gap-12 pt-16 sm:pt-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16 lg:pt-28">
          <div>
            <HeroReveal delay={0.1}>
              <h1 className="text-[2.25rem] font-bold leading-[0.96] tracking-[-0.045em] sm:text-[3.5rem] lg:text-[4.5rem]">
                Готовые ИИ-агенты.
              </h1>
            </HeroReveal>

            <HeroReveal delay={0.25}>
              <h1 className="mt-1 text-[2.25rem] font-bold leading-[0.96] tracking-[-0.045em] sm:text-[3.5rem] lg:text-[4.5rem]">
                <span className="text-primary">Один маркетплейс.</span>
              </h1>
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
              transition={{ duration: 1, delay: 0.7, ease: heroEase }}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]"
            >
              Покупатели находят решение под задачу за минуты. Продавцы публикуют один раз и зарабатывают на каждой подписке.
            </motion.p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.95, ease: heroEase }}
              >
                <Link
                  href="/agents"
                  className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                >
                  Найти агента
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.05, ease: heroEase }}
              >
                <Link
                  href="/seller"
                  className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-5 py-3 text-[14px] font-medium text-foreground transition-all hover:border-foreground/40 hover:bg-card"
                >
                  Опубликовать своего
                </Link>
              </motion.div>
              <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2, ease: heroEase }}
                href="#how"
                className="ml-1 font-mono text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                · как это устроено
              </motion.a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: heroEase }}
            className="relative"
          >
            <HeroAgentGrid agents={agents} />
          </motion.div>
        </div>
        </section>
      </div>

      {/* HOW IT WORKS — scroll-driven */}
      <section id="how" className="mt-28 scroll-mt-24 sm:mt-40">
        <ProcessTabsScroll />
      </section>

      {/* SELLER — moved above catalog so the two-sided model reads before the grid */}
      <section className="mt-28 sm:mt-40">
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
                <Link
                  href="/seller"
                  className="group inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-5 py-3 text-[14px] font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-card"
                >
                  Стать продавцом
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
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

      {/* CATALOG */}
      {agents.length > 0 && (
        <section className="mt-28 pb-28 sm:mt-40 sm:pb-40">
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
    </>
  );
}
