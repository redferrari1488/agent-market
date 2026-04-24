"use client";

import { useEffect, useRef, useState } from "react";
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

const TH = [0, 0.38, 0.72, 1];
const RING_R = 8;
const CIRCUM = 2 * Math.PI * RING_R;

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

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");

    let raf = 0;
    let pending = false;
    let listening = false;

    function compute() {
      pending = false;
      const container = containerRef.current;
      const nav = navRef.current;
      if (!container || !nav) return;
      if (!mql.matches) return;

      const rect = container.getBoundingClientRect();
      const scrollable = container.offsetHeight - window.innerHeight;
      const p =
        scrollable > 0
          ? Math.max(0, Math.min(1, -rect.top / scrollable))
          : 0;

      let s = 0;
      for (let i = TH.length - 2; i >= 0; i--) {
        if (p >= TH[i]) {
          s = i;
          break;
        }
      }
      const from = TH[s];
      const to = TH[s + 1];
      const local = to > from ? Math.min(1, Math.max(0, (p - from) / (to - from))) : 0;
      const fillUp = local;

      ringRefs.current.forEach((ring, i) => {
        if (!ring) return;
        let offset: number;
        if (i < s) offset = 0;
        else if (i === s) offset = CIRCUM * (1 - fillUp);
        else offset = CIRCUM;
        ring.style.strokeDashoffset = offset.toFixed(2);
      });

      // Highest step index whose ring is fully drawn — drives the "done"
      // state (checkmark visible). Separate from `active` so that the last
      // step can show a checkmark at full scroll too.
      const ringFullNow = fillUp >= 0.999 ? s : s - 1;
      if (ringFullNow !== ringFullIdxRef.current) {
        ringFullIdxRef.current = ringFullNow;
        setRingFullIdx(ringFullNow);
      }

      const steps = stepRefs.current;
      const navH = nav.offsetHeight;
      if (navH > 0 && steps[0]) {
        const nodeY = (i: number) => {
          const step = steps[i];
          return step ? step.offsetTop + 30 : 0;
        };
        const valid = steps.filter(Boolean) as HTMLDivElement[];
        const fp = s === 0 ? 14 : nodeY(s - 1);
        const tp = s < valid.length - 1 ? nodeY(s) : nodeY(valid.length - 1);
        const cur = fp + (tp - fp) * local;
        const spine = spineFillRef.current;
        if (spine) spine.style.height = `${(cur / navH) * 100}%`;
      }

      if (s !== activeRef.current) {
        activeRef.current = s;
        setActive(s);
      }
    }

    function onScroll() {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(compute);
    }

    function attach() {
      if (listening) return;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      listening = true;
      compute();
    }
    function detach() {
      if (!listening) return;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      listening = false;
    }

    if (mql.matches) attach();

    const onMqlChange = () => {
      if (mql.matches) {
        attach();
      } else {
        detach();
        const spine = spineFillRef.current;
        if (spine) spine.style.height = "0%";
        ringRefs.current.forEach((ring) => {
          if (ring) ring.style.strokeDashoffset = String(CIRCUM);
        });
      }
    };
    mql.addEventListener("change", onMqlChange);

    return () => {
      cancelAnimationFrame(raf);
      detach();
      mql.removeEventListener("change", onMqlChange);
    };
  }, []);

  // Mobile / non-desktop — mirror active step onto ring DOM + spine.
  // State (ringFullIdx / active) is set by handleStepClick; this effect
  // only synchronises the external DOM after React has rendered.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    if (mql.matches) return;

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      ring.style.strokeDashoffset = i < active ? "0" : CIRCUM.toFixed(2);
    });
    const spine = spineFillRef.current;
    const nav = navRef.current;
    const stepEl = stepRefs.current[active];
    if (spine && nav && stepEl && nav.offsetHeight > 0) {
      const y = stepEl.offsetTop + 30;
      spine.style.height = `${(y / nav.offsetHeight) * 100}%`;
    }
  }, [active]);

  function handleStepClick(i: number) {
    const mql = window.matchMedia("(min-width: 1024px)");
    if (mql.matches && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollable = container.offsetHeight - window.innerHeight;
      const targetP = TH[i] + 0.03;
      const targetScroll = window.scrollY + rect.top + scrollable * targetP;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    } else {
      activeRef.current = i;
      ringFullIdxRef.current = i - 1;
      setActive(i);
      setRingFullIdx(i - 1);
    }
  }

  const Mock = PROCESS_MOCKS[active];

  return (
    <div
      ref={containerRef}
      className="relative lg:h-[220vh]"
    >
      <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
          <h2 className="max-w-3xl text-[2.25rem] font-bold leading-[1] tracking-[-0.04em] sm:text-[3.25rem] lg:text-[4rem]">
            От выбора <span className="text-primary">до запуска.</span>
          </h2>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
            {/* Step navigator */}
            <div ref={navRef} className="relative">
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
              {/* Active spine fill — scroll-linked */}
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
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: heroEase }}
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
