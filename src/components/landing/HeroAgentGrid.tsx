"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  MessageSquare,
  PenTool,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import type { Agent } from "@/components/agents/AgentCard";

type CategoryKey =
  | "support"
  | "content"
  | "analytics"
  | "sales"
  | "monitoring";

const categoryConfig: Record<
  CategoryKey,
  { icon: React.ElementType; accent: string; bg: string; label: string }
> = {
  support: {
    icon: MessageSquare,
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
    label: "Поддержка",
  },
  content: {
    icon: PenTool,
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    label: "Контент",
  },
  analytics: {
    icon: BarChart3,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "Аналитика",
  },
  sales: {
    icon: ShoppingCart,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    label: "Продажи",
  },
  monitoring: {
    icon: Activity,
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
    label: "Мониторинг",
  },
};

const placeholderPalette = [
  { accent: "text-violet-400", bg: "bg-violet-500/10" },
  { accent: "text-cyan-400", bg: "bg-cyan-500/10" },
  { accent: "text-amber-400", bg: "bg-amber-500/10" },
  { accent: "text-emerald-400", bg: "bg-emerald-500/10" },
  { accent: "text-blue-400", bg: "bg-blue-500/10" },
  { accent: "text-rose-400", bg: "bg-rose-500/10" },
];

const FLOAT_PERIOD = [4.6, 5.2, 4.1, 5.8, 4.4, 5.5];
const FLOAT_AMP = [6, 8, 5, 7, 6, 8];
const FLOAT_PHASE = [0, 1.4, 2.7, 0.7, 2.0, 3.3];

const heroEase = [0.16, 1, 0.3, 1] as const;

export function HeroAgentGrid({ agents }: { agents: Agent[] }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotX = useSpring(useTransform(mouseY, [-1, 1], [4, -4]), {
    stiffness: 70,
    damping: 16,
  });
  const rotY = useSpring(useTransform(mouseX, [-1, 1], [-6, 6]), {
    stiffness: 70,
    damping: 16,
  });

  useEffect(() => {
    if (reduce) return;
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseX.set(Math.max(-1, Math.min(1, x)));
      mouseY.set(Math.max(-1, Math.min(1, y)));
    };
    const onLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [reduce, mouseX, mouseY]);

  const slots: Array<Agent | null> = [...agents.slice(0, 6)];
  while (slots.length < 6) slots.push(null);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ perspective: "1400px" }}
    >
      {/* Soft glow behind the grid — replaces the old blob canvas, much more local */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, color-mix(in srgb, var(--primary) 28%, transparent) 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
        style={{
          transformStyle: "preserve-3d",
          rotateX: reduce ? 0 : rotX,
          rotateY: reduce ? 0 : rotY,
        }}
      >
        {slots.map((agent, i) => (
          <FloatingCard
            key={agent?.id ?? `placeholder-${i}`}
            agent={agent}
            index={i}
            reduce={!!reduce}
          />
        ))}
      </motion.div>
    </div>
  );
}

function FloatingCard({
  agent,
  index,
  reduce,
}: {
  agent: Agent | null;
  index: number;
  reduce: boolean;
}) {
  const y = useMotionValue(0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const period = FLOAT_PERIOD[index] * 1000;
    const amp = FLOAT_AMP[index];
    const phase = FLOAT_PHASE[index] * 1000;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start + phase;
      y.set(Math.sin((elapsed / period) * Math.PI * 2) * amp);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, reduce, y]);

  if (!agent) {
    const c = placeholderPalette[index % placeholderPalette.length];
    return (
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.7,
          delay: 0.55 + index * 0.07,
          ease: heroEase,
        }}
        style={{ y, transformStyle: "preserve-3d" }}
        className="relative"
      >
        <div className="flex h-full min-h-[152px] flex-col rounded-xl border border-dashed border-border/50 bg-card/30 p-4 sm:min-h-[172px]">
          <div className="flex items-center justify-between">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg} ${c.accent}`}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              скоро
            </span>
          </div>
          <div className="mt-4 h-2 w-3/4 rounded-full bg-border/40" />
          <div className="mt-2 h-2 w-1/2 rounded-full bg-border/25" />
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="h-2 w-12 rounded-full bg-border/30" />
            <div className="h-2 w-2 rounded-full bg-border/40" />
          </div>
        </div>
      </motion.div>
    );
  }

  const key =
    agent.category && agent.category in categoryConfig
      ? (agent.category as CategoryKey)
      : "support";
  const cat = categoryConfig[key];
  const Icon = cat.icon;
  const price = ((agent.price_monthly || 0) / 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: 0.55 + index * 0.07,
        ease: heroEase,
      }}
      style={{ y, transformStyle: "preserve-3d" }}
      className="relative"
    >
      <Link
        href={`/agents/${agent.slug}`}
        className="group flex h-full min-h-[152px] flex-col rounded-xl border border-border/60 bg-background p-4 shadow-md shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-black/20 sm:min-h-[172px]"
      >
        <div className="flex items-center justify-between">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${cat.bg} ${cat.accent}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          {agent.rating_count > 0 ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-current text-amber-400" />
              <span className="tabular-nums">
                {agent.rating_avg.toFixed(1)}
              </span>
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              {cat.label}
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-1 text-[14px] font-semibold leading-tight tracking-tight">
          {agent.name}
        </h3>
        {agent.description ? (
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {agent.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-semibold leading-none tabular-nums">
              {price}
            </span>
            <span className="text-[10px] text-muted-foreground">₽/мес</span>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </Link>
    </motion.div>
  );
}
