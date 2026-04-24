"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PROCESS_MOCKS } from "@/components/landing/ProcessTabMocks";

const heroEase = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    title: "Выбираете",
    desc: "В каталоге уже собраны сценарии: поддержка, контент, аналитика, мониторинг. Не идея, а готовый формат работы.",
  },
  {
    title: "Подключаете",
    desc: "Ключи и рабочие параметры вводятся в кабинете. Без пересылки доступов в чат и ручной сборки по кускам.",
  },
  {
    title: "Работает",
    desc: "После запуска агент живёт в кабинете. Статус, история событий, логи и управление — всё под рукой.",
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
    const nav = navRef.current;
    if (spine && nav && nav.offsetHeight > 0) {
      const nodeY = (i: number) => {
        const step = stepRefs.current[i];
        return step ? step.offsetTop + 30 : 0;
      };
      const from = step === 0 ? 14 : nodeY(step - 1);
      const to = nodeY(step);
      const y = from + (to - from) * clamped;
      spine.style.height = `${(y / nav.offsetHeight) * 100}%`;
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
      reduceMotion.removeEventListener("change", onReduceMotionChange);
    };
  }, [pauseAutoplay, resumeAutoplay, setDoneIndex, startStep, syncProgress]);

  function handleStepClick(i: number) {
    startStep(i);
  }

  const Mock = PROCESS_MOCKS[active];

  return (
    <div
      ref={containerRef}
      className="relative"
    >
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
              className="relative min-h-[350px] sm:min-h-[360px]"
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

                      {/* Content */}
                      <div className="pl-10">
                        <h3
                          className={`text-[1.55rem] font-bold leading-[1.08] tracking-[-0.025em] transition-colors duration-500 sm:text-[1.95rem] ${
                            isActive || isDone
                              ? "text-foreground"
                              : "text-primary/[0.22] group-hover:text-primary/50"
                          }`}
                        >
                          {s.title}
                        </h3>
                        <AnimatePresence initial={false}>
                          {i === active && (
                            <motion.div
                              key="desc"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                height: { duration: 0.45, ease: heroEase },
                                opacity: { duration: 0.35, delay: 0.12, ease: heroEase },
                              }}
                              style={{ overflow: "hidden" }}
                            >
                              <p className="mt-3 max-w-md text-[15px] leading-[1.6] text-foreground/70 sm:text-[15.5px]">
                                {s.desc}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  </div>
                );
              })}
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
        </div>
      </div>
    </div>
  );
}
