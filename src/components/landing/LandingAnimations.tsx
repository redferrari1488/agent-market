"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { AgentCardLegacy } from "@/components/agents/AgentCardLegacy";
import { HeroSplit } from "@/components/landing/HeroSplit";
import { FlowCinematic } from "@/components/landing/FlowCinematic";
import { MobileLanding } from "@/components/landing/redesign/MobileLanding";
import { FadeIn, ScaleIn, StaggerList, StaggerItem } from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";
import "./cockpit-landing.css";

const heroEase = [0.16, 1, 0.3, 1] as const;

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      {/* HERO — компактный split. HeroSplit сам рендерит свой section
          с hr-desktop-only (показ только на >=881px). Mobile hero внутри
          MobileLanding (см. ниже). */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: heroEase }}
      >
        <HeroSplit agents={agents} />
      </motion.div>

      {/* Mobile: полный мобильный лендинг из редизайна (Hireon Redesign 2026-05-16).
          Виден только на <=880px, десктопные секции ниже скрыты симметрично. */}
      <MobileLanding agents={agents} />

      {/* Единый фон для всех пост-hero секций — совпадает с FlowCinematic bg-0 */}
      <div className="bg-[#0f0e0c] hr-desktop-only">
      {/* HOW IT WORKS — cinematic stepper */}
      <section id="how" className="scroll-mt-24">
        <FlowCinematic />
      </section>

      {/* CATALOG */}
      {agents.length > 0 && (
        <section className="border-t border-[rgba(244,236,222,0.10)] py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <FadeIn y={40}>
              <div className="flex items-end justify-between gap-6">
                <h2 className="max-w-2xl text-[2.25rem] font-bold tracking-[-0.03em] sm:text-[3rem] text-[#f1ebe0]">
                  Каталог <span style={{ color: "var(--hc-cyan, oklch(0.74 0.13 195))" }}>агентов.</span>
                </h2>
                <Link
                  href="/agents"
                  className="hidden items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-[rgba(241,235,224,0.36)] transition-colors hover:text-[oklch(0.74_0.13_195)] sm:flex"
                >
                  все агенты
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>

            <div className="mt-12">
              <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {agents.slice(0, 3).map((agent) => (
                  <StaggerItem key={agent.id} className="h-full">
                    <AgentCardLegacy agent={agent} />
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>
          </div>
        </section>
      )}

      {/* SELLER — мок выплаты + текст слева */}
      <section className="border-t border-[rgba(244,236,222,0.06)] py-32">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <FadeIn y={40}>
              <h2 className="max-w-2xl text-[2.25rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[3rem] text-[#f1ebe0]">
                Публикуете один раз.{" "}
                <span style={{ color: "oklch(0.74 0.13 195)" }}>Продаёт площадка.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[rgba(241,235,224,0.78)]">
                Загружаете продукт, назначаете цену, продаёте напрямую.{" "}
                <span style={{ color: "#f1ebe0", fontWeight: 500 }}>0% комиссии.</span>{" "}
                Каталог, путь покупателя и контакт с продавцом уже собраны.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/seller"
                  className="group inline-flex h-12 items-center gap-2 rounded-lg bg-[oklch(0.74_0.13_195)] px-6 font-mono text-[14px] font-medium uppercase tracking-[0.12em] text-[#0a0a09] transition-[filter,transform] hover:brightness-110 hover:translate-y-[-1px]"
                >
                  стать продавцом
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[rgba(241,235,224,0.56)]">
                  0% комиссии · прямые продажи
                </span>
              </div>
            </FadeIn>

            <ScaleIn>
              <div className="relative mx-auto w-full max-w-md">
                {/* liquid glass подача (Landing v4) — .hr-glass-payout в cockpit-landing.css */}
                <div className="hr-glass-payout overflow-hidden rounded-xl">
                  <div className="flex items-center justify-between border-b border-[rgba(244,236,222,0.06)] px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold tracking-tight text-[#f1ebe0]">
                          Выплата
                        </div>
                        <div className="font-mono text-[10px] text-[rgba(232,232,236,0.30)]">
                          май 2026
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
                      <span className="text-[2.5rem] font-bold leading-none tracking-[-0.03em] text-[#f1ebe0]">
                        <PayoutCountUp target={167000} />
                      </span>
                      <span className="text-[14px] text-[rgba(241,235,224,0.36)]">
                        ₽
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +24% к июню
                    </div>
                    <PayoutChart />
                  </div>

                  <div className="space-y-2.5 border-t border-[rgba(244,236,222,0.06)] px-5 py-4 font-mono text-[11.5px]">
                    <div className="flex justify-between">
                      <span className="text-[rgba(241,235,224,0.36)]">
                        Прямые продажи
                      </span>
                      <span className="text-[rgba(232,232,236,0.85)]">167 000 ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[rgba(241,235,224,0.36)]">
                        Комиссия площадки
                      </span>
                      <span className="text-emerald-400/85">0 ₽</span>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(244,236,222,0.06)] pt-2.5 text-[#f1ebe0]">
                      <span className="font-semibold">К выплате</span>
                      <span className="font-semibold">167 000 ₽</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[rgba(244,236,222,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(232,232,236,0.30)]">
                    <span>Публикация · 1 раз</span>
                    <span>Каталог · 24/7</span>
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

// Count-up суммы выплаты при появлении карточки в viewport (Landing v4).
// Пишет напрямую в textContent через rAF — без React state (re-render
// каждый кадр не нужен). prefers-reduced-motion — сразу финальное значение.
function PayoutCountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = (v: number) => {
      el.textContent = v.toLocaleString("ru-RU");
    };
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
          done(target);
          return;
        }
        const dur = 1400;
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          done(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return <span ref={ref}>0</span>;
}

// Catmull-Rom → cubic bezier: гладкая кривая через точки без рывков на узлах.
function smoothPath(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length < 2) return "";
  const d = [`M${pts[0][0]},${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(
      `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`,
    );
  }
  return d.join(" ");
}

// Помесячный рост выплат — восходящая кривая с лёгким ускорением («хоккейная
// клюшка»). Y растёт вниз, поэтому убывание Y = рост суммы.
const PAYOUT_POINTS = [
  [0, 62],
  [45, 60],
  [90, 56],
  [135, 51],
  [180, 45],
  [225, 38],
  [270, 30],
  [315, 19],
  [360, 9],
] as const;

const PAYOUT_LINE = smoothPath(PAYOUT_POINTS);
const PAYOUT_AREA = `${PAYOUT_LINE} L360,72 L0,72 Z`;

// График роста выплат. Линия рисуется (stroke-dashoffset) при появлении в
// вьюпорте — синхронно с count-up суммы. Стили/анимация — globals.css
// (.hr-payout-*). prefers-reduced-motion → сразу финальное состояние.
function PayoutChart() {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        el.classList.add("is-in");
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className="hr-payout-chart mt-3 block w-full"
      viewBox="0 0 360 72"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hr-payout-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.74 0.14 155)" stopOpacity="0.26" />
          <stop offset="1" stopColor="oklch(0.74 0.14 155)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="hr-payout-area" d={PAYOUT_AREA} fill="url(#hr-payout-fill)" />
      <path
        className="hr-payout-line"
        d={PAYOUT_LINE}
        pathLength={1}
        fill="none"
        stroke="oklch(0.74 0.14 155)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="hr-payout-dot" cx={360} cy={9} r={3.5} fill="oklch(0.74 0.14 155)" />
    </svg>
  );
}
