"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";
import { ProcessTabsScroll } from "@/components/landing/ProcessTabsScroll";
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

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  const reduceMotion = useReducedMotion();
  return (
    <>
      {/* HERO */}
      <div className="relative overflow-x-clip">
        {/* Ambient video background (Veo-generated). Falls back to static
            poster when the user prefers reduced motion. */}
        {reduceMotion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/hero-poster.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply dark:opacity-65 dark:mix-blend-normal [filter:blur(2px)_saturate(1.15)_contrast(1.2)]"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-poster.webp"
            preload="metadata"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply dark:opacity-65 dark:mix-blend-normal [filter:blur(2px)_saturate(1.15)_contrast(1.2)]"
          >
            <source src="/hero-bg.webm" type="video/webm" />
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
        )}
        {/* Dark-only dimmer — on light theme the multiply blend already tames the plasma */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-background/35 dark:block"
        />
        {/* Left-side gradient: keep headline area readable on light theme */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/30"
        />
        {/* Top fade — softens the upper edge so plasma doesn't slam into the header */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"
        />
        {/* Bottom fade into next section */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background"
        />

        <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">
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
              {/*
                Anchor — только hash, никакого роутинга. Используем
                нативный <a>, чтобы next/link не пытался prefetch / route
                transition (был баг: иногда клик "повисал" на main thread
                во время работы framer-motion layoutId анимаций
                ProcessTabs ниже по странице).
              */}
              <a
                href="#how"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                · как это устроено
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
      </div>

      {/* HOW IT WORKS — scroll-driven */}
      <section id="how" className="mt-28 scroll-mt-24 sm:mt-40">
        <ProcessTabsScroll />
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

      {/* SELLER — 0% commission manifesto, vitrina-aligned */}
      <section className="relative mt-28 overflow-hidden bg-[#0c0c0e] py-24 text-[#eceaf2] sm:mt-40 sm:py-32">
        {/* subtle cyan ambient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.68 0.19 195 / 0.07), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <FadeIn y={40}>
              <p
                className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[oklch(0.68_0.19_195)]/70"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Продавцам
              </p>
              <h2
                className="mt-5 max-w-md text-[2.25rem] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[3.25rem]"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                Публикуете один раз.{" "}
                <span className="text-[oklch(0.68_0.19_195)]">
                  Деньги — мимо нас.
                </span>
              </h2>
              <p
                className="mt-6 max-w-md text-[15px] leading-relaxed text-[#65636e]"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                <span className="text-[#eceaf2]">0% комиссии.</span> Покупатель
                платит вам напрямую — на карту, счёт самозанятого или ИП.
                Hireon — каталог и трафик, не посредник.
              </p>
              <div className="mt-10">
                <Link
                  href="/seller"
                  className="group inline-flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-[0.12em] text-[#eceaf2] transition-colors hover:text-[oklch(0.68_0.19_195)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span className="text-[oklch(0.68_0.19_195)]">[</span>
                  <span>стать продавцом</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  <span className="text-[oklch(0.68_0.19_195)]">]</span>
                </Link>
              </div>
            </FadeIn>

            <ScaleIn>
              <div className="relative mx-auto w-full max-w-md">
                <div
                  className="relative overflow-hidden border border-[oklch(0.68_0.19_195)]/60 bg-[#111115]"
                  style={{
                    boxShadow:
                      "0 0 0 1px oklch(0.68 0.19 195 / 0.4), 0 0 36px oklch(0.68 0.19 195 / 0.18), 0 0 80px oklch(0.68 0.19 195 / 0.06)",
                  }}
                >
                  {/* scanline overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "repeating-linear-gradient(0deg, transparent, transparent 3px, oklch(0.68 0.19 195 / 0.025) 3px, oklch(0.68 0.19 195 / 0.025) 4px)",
                    }}
                  />

                  <div className="relative flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                    <span
                      className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.68_0.19_195)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      поступление
                    </span>
                    <span
                      className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] text-[#65636e]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgb(74_222_128)]" />
                      14:32 · карта
                    </span>
                  </div>

                  <div className="relative px-5 py-6">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-[3rem] font-bold leading-none tracking-[-0.03em]"
                        style={{ fontFamily: "var(--font-manrope)" }}
                      >
                        + 1 900
                      </span>
                      <span className="text-[16px] text-[#65636e]">₽</span>
                    </div>
                    <div
                      className="mt-3 font-mono text-[11.5px] text-[#a8a6b0]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Telegram Support Bot · подписка
                    </div>
                    <div
                      className="mt-1 font-mono text-[11px] text-[#65636e]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      от @anna_k
                    </div>
                  </div>

                  <div
                    className="relative flex items-center justify-between border-t border-white/[0.06] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#65636e]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <span>апрель · 47 продаж</span>
                    <span className="text-[#a8a6b0]">89 300 ₽</span>
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
