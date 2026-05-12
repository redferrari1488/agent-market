"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AgentCardLegacy } from "@/components/agents/AgentCardLegacy";
import { HeroCockpit } from "@/components/landing/HeroCockpit";
import { FlowCinematic } from "@/components/landing/FlowCinematic";
import { FadeIn, ScaleIn, StaggerList, StaggerItem } from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";
import "./cockpit-landing.css";

const heroEase = [0.16, 1, 0.3, 1] as const;

// Hero видео иногда останавливается в Safari / iOS low-power / при возврате
// на вкладку. Этот компонент пытается мягко возобновить воспроизведение:
// слушает pause/visibilitychange/IntersectionObserver и зовёт .play() обратно.
function BackgroundVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // ignore — авто-плей мог быть заблокирован, попробуем при следующем
          // событии (тач/скролл).
        });
      }
    };

    const handlePause = () => {
      // Если видео ставится на паузу не по концу — пытаемся возобновить.
      if (!video.ended) tryPlay();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    const handleStalled = () => tryPlay();
    const handleSuspend = () => {
      if (video.paused) tryPlay();
    };

    video.addEventListener("pause", handlePause);
    video.addEventListener("stalled", handleStalled);
    video.addEventListener("suspend", handleSuspend);
    document.addEventListener("visibilitychange", handleVisibility);

    // На случай, если автоплей не сработал на mount — однократный «толчок».
    tryPlay();

    return () => {
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("stalled", handleStalled);
      video.removeEventListener("suspend", handleSuspend);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      poster="/hero-poster.webp"
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      className={className}
    >
      <source src="/hero-bg.webm" type="video/webm" />
      <source src="/hero-bg.mp4" type="video/mp4" />
    </video>
  );
}

const ROTATING_WORDS = [
  "Поддержка",
  "Контент",
  "Аналитика",
  "Мониторинг",
  "Любая задача.",
];

const LONGEST_ROTATING_WORD = ROTATING_WORDS.reduce((a, b) =>
  a.length >= b.length ? a : b,
);

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
      className="relative inline-grid overflow-hidden align-bottom pb-[0.22em] pt-[0.05em]"
      style={{
        whiteSpace: "nowrap",
        gridTemplateAreas: '"slot"',
      }}
    >
      {/* sizer — фиксирует ширину/высоту по самому длинному слову; в той же grid-ячейке */}
      <span
        aria-hidden="true"
        className="invisible"
        style={{ gridArea: "slot" }}
      >
        {LONGEST_ROTATING_WORD}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ROTATING_WORDS[index]}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.45, ease: heroEase }}
          className="text-primary tracking-[-0.015em]"
          style={{ whiteSpace: "nowrap", gridArea: "slot" }}
        >
          {ROTATING_WORDS[index]}
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

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  const reduceMotion = useReducedMotion();
  return (
    <>
      {/* HERO — cockpit layout поверх ambient видеофона */}
      <div className="hireon-hero relative overflow-x-clip">
        {/* Ambient video background. Reduced-motion users get a static
            poster instead. */}
        {reduceMotion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/hero-poster.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-65 mix-blend-normal [filter:blur(2px)_saturate(1.15)_contrast(1.2)]"
          />
        ) : (
          <BackgroundVideo className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-65 mix-blend-normal [filter:blur(2px)_saturate(1.15)_contrast(1.2)]" />
        )}
        {/* Базовое затемнение чтобы плазма не забивала контент */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#0c0c0e]/55"
        />
        {/* Левый градиент: держит heading-зону читаемой */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0c0c0e] via-[#0c0c0e]/85 to-[#0c0c0e]/40"
        />
        {/* Верхний fade — мягкий выход из header */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0c0c0e] to-transparent"
        />
        {/* Нижний fade — переход в bg-0 секции flow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#0c0c0e]"
        />

        <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 pt-20 sm:pt-28 lg:pt-32 pb-16 sm:pb-24">
          {/* heading + sub */}
          <div className="hf-hero-head mb-12 sm:mb-16">
            <div>
              <HeroReveal delay={0.1}>
                <h1 className="text-[2rem] font-bold leading-[0.94] tracking-[-0.05em] sm:text-[4.5rem] lg:text-[5.75rem]">
                  AI-агенты для бизнеса.
                </h1>
              </HeroReveal>

              <HeroReveal delay={0.25}>
                <div className="mt-2 text-[1.75rem] font-bold leading-[0.94] tracking-[-0.05em] sm:text-[3.5rem] lg:text-[4.5rem]">
                  <RotatingWord />
                </div>
              </HeroReveal>
            </div>

            <div className="flex flex-col gap-5 pb-2">
              <motion.p
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 0.75, ease: heroEase }}
                className="max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]"
              >
                Поддержка, контент, аналитика, мониторинг — и любая другая
                задача бизнеса. AI-модель уже подключена, запуск — за несколько
                минут. Ниже — реальная панель управления клиента, прямо сейчас.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.05, ease: heroEase }}
                className="flex flex-wrap items-center gap-2.5"
              >
                <Link
                  href="/agents"
                  className="hf-btn hf-btn-cyan"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  открыть каталог
                </Link>
                <a
                  href="#how"
                  className="hf-btn"
                  style={{ textDecoration: "none" }}
                  onClick={(e) => {
                    const target = document.getElementById("how");
                    if (!target) return;
                    e.preventDefault();
                    const headerOffset = 72;
                    const top =
                      target.getBoundingClientRect().top +
                      window.pageYOffset -
                      headerOffset;
                    window.scrollTo({ top, behavior: "smooth" });
                    history.replaceState(null, "", "#how");
                  }}
                >
                  как это устроено
                </a>
              </motion.div>
            </div>
          </div>

          {/* HeroCockpit — основной "живой" дашборд */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.85, ease: heroEase }}
          >
            <HeroCockpit />
          </motion.div>
        </section>
      </div>

      {/* Единый фон для всех пост-hero секций — совпадает с FlowCinematic bg-0 */}
      <div className="bg-[#0c0c0e]">
      {/* HOW IT WORKS — cinematic stepper */}
      <section id="how" className="scroll-mt-24">
        <FlowCinematic />
      </section>

      {/* CATALOG */}
      {agents.length > 0 && (
        <section className="border-t border-white/[0.04] py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <FadeIn y={40}>
              <div className="flex items-end justify-between gap-6">
                <h2 className="max-w-2xl text-[2.25rem] font-bold tracking-[-0.03em] sm:text-[3rem] text-[#e8e8ec]">
                  Каталог <span style={{ color: "var(--hc-cyan, oklch(0.68 0.19 195))" }}>агентов.</span>
                </h2>
                <Link
                  href="/agents"
                  className="hidden items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-[rgba(232,232,236,0.48)] transition-colors hover:text-[oklch(0.68_0.19_195)] sm:flex"
                >
                  все агенты
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>

            <div className="mt-12">
              <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {agents.map((agent) => (
                  <StaggerItem key={agent.id}>
                    <AgentCardLegacy agent={agent} />
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>
          </div>
        </section>
      )}

      {/* SELLER — мок выплаты + текст слева */}
      <section className="border-t border-white/[0.04] py-32">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <FadeIn y={40}>
              <h2 className="max-w-2xl text-[2.25rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[3rem] text-[#e8e8ec]">
                Публикуете один раз.{" "}
                <span style={{ color: "oklch(0.68 0.19 195)" }}>Продаёт площадка.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[rgba(232,232,236,0.72)]">
                Загружаете продукт, назначаете цену, продаёте напрямую — 0%
                комиссии. Каталог, путь покупателя и контакт с продавцом уже
                собраны.
              </p>
              <div className="mt-10">
                <Link
                  href="/seller"
                  className="group inline-flex h-11 items-center gap-2 rounded-lg border border-[oklch(0.68_0.19_195)] px-5 font-mono text-[13px] uppercase tracking-[0.12em] text-[oklch(0.68_0.19_195)] transition-colors hover:bg-[oklch(0.68_0.19_195_/_0.08)]"
                >
                  стать продавцом
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </FadeIn>

            <ScaleIn>
              <div className="relative mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.09)] bg-[#111115] shadow-xl shadow-black/40">
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold tracking-tight text-[#e8e8ec]">
                          Выплата
                        </div>
                        <div className="font-mono text-[10px] text-[rgba(232,232,236,0.30)]">
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
                      <span className="text-[2.5rem] font-bold leading-none tracking-[-0.03em] text-[#e8e8ec]">
                        167 000
                      </span>
                      <span className="text-[14px] text-[rgba(232,232,236,0.48)]">
                        ₽
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +24% к маю
                    </div>
                  </div>

                  <div className="space-y-2.5 border-t border-[rgba(255,255,255,0.06)] px-5 py-4 font-mono text-[11.5px]">
                    <div className="flex justify-between">
                      <span className="text-[rgba(232,232,236,0.48)]">
                        Прямые продажи
                      </span>
                      <span className="text-[rgba(232,232,236,0.85)]">167 000 ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[rgba(232,232,236,0.48)]">
                        Комиссия площадки
                      </span>
                      <span className="text-emerald-400/85">0 ₽</span>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(255,255,255,0.06)] pt-2.5 text-[#e8e8ec]">
                      <span className="font-semibold">К выплате</span>
                      <span className="font-semibold">167 000 ₽</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] bg-[#16161b] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(232,232,236,0.30)]">
                    <span>Продаж · 47</span>
                    <span>Активных · 31</span>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
