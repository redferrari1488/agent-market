"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PROCESS_MOCKS } from "@/components/landing/ProcessTabMocks";

const heroEase = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    title: "Выбираете",
    eyebrow: "Готовые сценарии в каталоге.",
    desc: "Поддержка, контент, аналитика, мониторинг. Не идея, а готовый формат работы.",
  },
  {
    title: "Подключаете",
    eyebrow: "Ключи и параметры в кабинете.",
    desc: "Без пересылки доступов в чат и ручной сборки по кускам.",
  },
  {
    title: "Работает",
    eyebrow: "Живёт в кабинете 24/7.",
    desc: "Статус, история событий, логи и управление под рукой.",
  },
];

const RING_R = 8;
const CIRCUM = 2 * Math.PI * RING_R;
const AUTOPLAY_MS = 4000;
const DONE_HOLD_MS = 360;

export function ProcessTabsScroll() {
  const [active, setActive] = useState(0);
  const [ringFullIdx, setRingFullIdx] = useState(-1);
  const activeRef = useRef(0);
  const ringFullIdxRef = useRef(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const spineFillRef = useRef<HTMLSpanElement>(null);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([null, null, null]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const isVisibleRef = useRef(false);
  const reduceMotionRef = useRef(false);

  // Cached layout — recomputed only on resize, not on every RAF tick.
  const nodeYsRef = useRef<number[]>([0, 0, 0]);
  const navHeightRef = useRef(0);

  const measureLayout = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    navHeightRef.current = nav.offsetHeight;
    stepRefs.current.forEach((step, i) => {
      nodeYsRef.current[i] = step ? step.offsetTop + 30 : 0;
    });
  }, []);

  const setDoneIndex = useCallback((idx: number) => {
    if (idx === ringFullIdxRef.current) return;
    ringFullIdxRef.current = idx;
    setRingFullIdx(idx);
  }, []);

  const syncProgress = useCallback((step: number, progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      let offset = CIRCUM;
      if (i < step) offset = 0;
      else if (i === step) offset = CIRCUM * (1 - clamped);
      ring.style.strokeDashoffset = offset.toFixed(2);
    });

    const spine = spineFillRef.current;
    const navHeight = navHeightRef.current;
    if (spine && navHeight > 0) {
      const ys = nodeYsRef.current;
      const from = step === 0 ? 14 : ys[step - 1] ?? 0;
      const to = ys[step] ?? 0;
      const y = from + (to - from) * clamped;
      spine.style.height = `${(y / navHeight) * 100}%`;
    }
  }, []);

  const startStep = useCallback((step: number, now = performance.now()) => {
    activeRef.current = step;
    setActive(step);
    setDoneIndex(step - 1);
    startTimeRef.current = now;
    syncProgress(step, 0);
  }, [setDoneIndex, syncProgress]);

  const pauseAutoplay = useCallback(() => {
    if (isPausedRef.current) return;
    isPausedRef.current = true;
    pauseStartRef.current = performance.now();
  }, []);

  const resumeAutoplay = useCallback(() => {
    if (!isPausedRef.current) return;
    const pauseStart = pauseStartRef.current;
    if (pauseStart != null) {
      startTimeRef.current += performance.now() - pauseStart;
    }
    pauseStartRef.current = null;
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = reduceMotion.matches;
    activeRef.current = 0;
    ringFullIdxRef.current = -1;
    startTimeRef.current = performance.now();
    measureLayout();
    syncProgress(0, 0);

    const onReduceMotionChange = () => {
      reduceMotionRef.current = reduceMotion.matches;
      if (reduceMotion.matches) {
        syncProgress(activeRef.current, 1);
        setDoneIndex(activeRef.current);
      } else {
        startStep(activeRef.current, performance.now());
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        if (isVisibleRef.current) resumeAutoplay();
        else pauseAutoplay();
      },
      { threshold: [0, 0.35, 0.7] },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const resizeObserver = new ResizeObserver(() => {
      measureLayout();
    });
    if (navRef.current) resizeObserver.observe(navRef.current);

    const tick = (now: number) => {
      if (
        !reduceMotionRef.current &&
        isVisibleRef.current &&
        !isPausedRef.current
      ) {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(1, elapsed / AUTOPLAY_MS);
        const current = activeRef.current;
        syncProgress(current, progress);
        setDoneIndex(progress >= 0.995 ? current : current - 1);

        if (elapsed >= AUTOPLAY_MS + DONE_HOLD_MS) {
          startStep((current + 1) % STEPS.length, now);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    reduceMotion.addEventListener("change", onReduceMotionChange);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", onReduceMotionChange);
    };
  }, [measureLayout, pauseAutoplay, resumeAutoplay, setDoneIndex, startStep, syncProgress]);

  function handleStepClick(i: number) {
    startStep(i);
  }

  const Mock = PROCESS_MOCKS[active];

  return (
    <div ref={containerRef} className="relative">
      <div className="lg:flex lg:items-center">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
          <h2 className="max-w-3xl text-[2.25rem] font-bold leading-[1] tracking-[-0.04em] sm:text-[3.25rem] lg:text-[4rem]">
            От выбора <span className="text-primary">до запуска.</span>
          </h2>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
            {/* Step navigator */}
            <div
              ref={navRef}
              onFocusCapture={pauseAutoplay}
              onBlurCapture={resumeAutoplay}
              className="relative"
            >
              {/* Continuous muted spine */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-[9px] top-0 bottom-0 w-[2px] rounded-full bg-border/40"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, black 18px, black calc(100% - 18px), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, black 18px, black calc(100% - 18px), transparent 100%)",
                }}
              />
              {/* Active spine fill — autoplay-linked */}
              <span
                ref={spineFillRef}
                aria-hidden
                className="pointer-events-none absolute left-[9px] top-0 w-[2px] rounded-full bg-primary"
                style={{ height: "0%", willChange: "height" }}
              />

              {STEPS.map((s, i) => {
                const isDone = i <= ringFullIdx;
                const isActive = i === active && !isDone;
                const isLast = i === STEPS.length - 1;
                return (
                  <div
                    key={s.title}
                    ref={(el) => {
                      stepRefs.current[i] = el;
                    }}
                    className={`relative ${isLast ? "" : "border-b border-border/20"}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleStepClick(i)}
                      className="group relative block w-full cursor-pointer py-5 text-left"
                    >
                      {/* Node */}
                      <div
                        className="pointer-events-none absolute left-0 flex h-[20px] w-[20px] items-center justify-center"
                        style={{ top: "20px" }}
                      >
                        {/* Soft halo on active — pulses subtly via opacity */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              key="halo"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.15, 1] }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 2, ease: heroEase, repeat: Infinity }}
                              className="absolute h-[34px] w-[34px] rounded-full"
                              style={{
                                background:
                                  "radial-gradient(circle, var(--primary) 0%, transparent 65%)",
                                filter: "blur(2px)",
                                opacity: 0.35,
                              }}
                            />
                          )}
                        </AnimatePresence>
                        <svg
                          viewBox="0 0 20 20"
                          className="absolute inset-0 h-full w-full -rotate-90"
                          style={{ overflow: "visible" }}
                        >
                          {/* background ring */}
                          <circle
                            cx="10"
                            cy="10"
                            r={RING_R}
                            strokeWidth="2"
                            style={{
                              fill: "var(--background)",
                              stroke: "var(--border)",
                            }}
                          />
                          {/* progress ring */}
                          <circle
                            ref={(el) => {
                              ringRefs.current[i] = el;
                            }}
                            cx="10"
                            cy="10"
                            r={RING_R}
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray={CIRCUM.toFixed(2)}
                            strokeDashoffset={CIRCUM.toFixed(2)}
                            style={{ stroke: "var(--primary)" }}
                          />
                        </svg>
                        {/* Active core */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              key="core"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: [1, 1.45, 1], opacity: [1, 0.72, 1] }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                duration: 1.4,
                                ease: heroEase,
                                repeat: Infinity,
                              }}
                              className="relative block h-[5px] w-[5px] rounded-full bg-primary"
                            />
                          )}
                        </AnimatePresence>
                        {/* Checkmark on done */}
                        <AnimatePresence>
                          {isDone && (
                            <motion.svg
                              key="check"
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              transition={{ duration: 0.22, ease: heroEase }}
                              viewBox="0 0 10 8"
                              className="pointer-events-none absolute h-[8px] w-[8px]"
                              fill="none"
                            >
                              <path
                                d="M1 4 L3.8 7 L9 1"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ stroke: "var(--primary)" }}
                              />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Content — fixed height keeps offsetTop stable across active changes */}
                      <div className="pl-10 min-h-[128px] sm:min-h-[136px]">
                        <h3
                          className={`text-[1.55rem] font-bold leading-[1.08] tracking-[-0.025em] transition-colors duration-200 sm:text-[1.95rem] ${
                            isActive
                              ? "text-foreground"
                              : isDone
                                ? "text-foreground/85"
                                : "text-foreground/55 group-hover:text-foreground/80"
                          }`}
                        >
                          {s.title}
                        </h3>
                        <p
                          className={`mt-2 text-[13.5px] leading-[1.5] transition-colors duration-200 sm:text-[14px] ${
                            isActive ? "text-foreground/70" : "text-foreground/40"
                          }`}
                        >
                          {s.eyebrow}
                        </p>
                        {/* Reserved slot for desc — always 2 lines tall, no layout shift */}
                        <div className="relative mt-2 h-[44px] sm:h-[48px]">
                          <p
                            aria-hidden={!isActive}
                            className={`absolute inset-x-0 top-0 max-w-md text-[14.5px] leading-[1.5] text-muted-foreground transition-opacity duration-300 ease-out sm:text-[15px] ${
                              i === active ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Mock — one shown at a time, cross-fade on active change */}
            <div className="lg:max-w-[580px] lg:justify-self-end lg:self-start">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`mock-${active}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: heroEase }}
                  style={{ willChange: "opacity" }}
                >
                  <Mock />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
