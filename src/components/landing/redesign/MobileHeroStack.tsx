"use client";

import { useEffect, useRef, useState } from "react";
import {
  CatChip,
  Eyebrow,
  HeroBgFX,
  PrimaryCTA,
  SecondaryCTA,
  Stat,
  monoStyle,
  onestStyle,
} from "@/components/landing/redesign/shared";
import type { Agent } from "@/components/agents/AgentCard";

// Hero B (Stacked Cards · swipeable) — портирован из Claude Design
// mobile-designs.html → hero-v2. Стопка из 3 видимых карточек в 3D-глубине,
// фронтальная активна (живая эмблема + swipe), задние — статичные плейсхолдеры.
// Auto-advance каждые 4.2с, останавливается на первом swipe/tap.

type Kind = "chat" | "doc" | "radar" | "funnel";

const KIND_BY_CAT: Record<string, Kind> = {
  support: "chat",
  content: "doc",
  monitoring: "radar",
  sales: "funnel",
  analytics: "funnel",
};

const CAT_TOKEN: Record<string, { label: string; color: string }> = {
  support: { label: "поддержка", color: "var(--hr-cat-support)" },
  content: { label: "контент", color: "var(--hr-cat-content)" },
  monitoring: { label: "мониторинг", color: "var(--hr-cat-monitoring)" },
  sales: { label: "продажи", color: "var(--hr-cat-sales)" },
  analytics: { label: "аналитика", color: "var(--hr-cat-analytics)" },
};

type StackCardData = {
  id: string;
  cat: string;
  color: string;
  title: string;
  price: string;
  sub: string;
  kind: Kind;
};

function formatPrice(minor: number | null | undefined): string {
  if (!minor || minor <= 0) return "—";
  return `${Math.floor(minor / 100).toLocaleString("ru-RU")} ₽`;
}

// Берём по одному агенту из каждой категории, у которой есть kind-маппинг.
// Если в каталоге не хватает — добиваем fallback'ом, чтобы стопка не была пустой.
function buildStack(agents: Agent[]): StackCardData[] {
  const seen = new Set<string>();
  const result: StackCardData[] = [];
  const published = agents.filter((a) => a.status === "published" && !a.is_external);

  for (const a of published) {
    const cat = a.category ?? "";
    const kind = KIND_BY_CAT[cat];
    if (!kind || seen.has(cat)) continue;
    seen.add(cat);
    const token = CAT_TOKEN[cat];
    result.push({
      id: a.slug,
      cat: token?.label ?? cat,
      color: token?.color ?? "var(--hr-fg-3)",
      title: a.name,
      price: formatPrice(a.price_monthly),
      sub: a.description ?? "",
      kind,
    });
    if (result.length >= 4) break;
  }

  if (result.length >= 2) return result;

  const fallback: StackCardData[] = [
    {
      id: "fallback-support",
      cat: "поддержка",
      color: "var(--hr-cat-support)",
      title: "Поддержка в Telegram",
      price: "—",
      sub: "Отвечает 24/7, ведёт диалоги, эскалирует сложные.",
      kind: "chat",
    },
    {
      id: "fallback-content",
      cat: "контент",
      color: "var(--hr-cat-content)",
      title: "Контент-редактор",
      price: "—",
      sub: "Готовит план постов и пишет драфты в тоне бренда.",
      kind: "doc",
    },
    {
      id: "fallback-monitor",
      cat: "мониторинг",
      color: "var(--hr-cat-monitoring)",
      title: "Мониторинг сайтов",
      price: "—",
      sub: "Каждые 60 сек проверяет uptime и пишет в Slack.",
      kind: "radar",
    },
    {
      id: "fallback-sales",
      cat: "продажи",
      color: "var(--hr-cat-sales)",
      title: "Lead Qualifier",
      price: "—",
      sub: "Квалифицирует входящие, помечает горячих в CRM.",
      kind: "funnel",
    },
  ];
  for (const f of fallback) {
    if (result.find((r) => r.kind === f.kind)) continue;
    result.push(f);
    if (result.length >= 4) break;
  }
  return result;
}

// ── AgentEmblem ─────────────────────────────────────────────────────────
function AgentEmblem({ kind, color, front }: { kind: Kind; color: string; front: boolean }) {
  const size = 92;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, transparent 62%)`,
          opacity: 0.32,
          filter: "blur(14px)",
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: "relative" }}
      >
        <circle cx="50" cy="50" r="47" strokeOpacity="0.55" />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const r1 = 47;
          const r2 = 43;
          const r = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={50 + Math.cos(r) * r2}
              y1={50 + Math.sin(r) * r2}
              x2={50 + Math.cos(r) * r1}
              y2={50 + Math.sin(r) * r1}
              strokeOpacity="0.5"
            />
          );
        })}
        {kind === "chat" && <EmblemChat front={front} />}
        {kind === "doc" && <EmblemDoc front={front} />}
        {kind === "radar" && <EmblemRadar front={front} />}
        {kind === "funnel" && <EmblemFunnel front={front} />}
      </svg>
      {front && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--hr-teal)",
            boxShadow: "0 0 8px var(--hr-teal)",
            animation: "hr-pulse-dot 1.6s ease-out infinite",
          }}
        />
      )}
    </div>
  );
}

function EmblemChat({ front }: { front: boolean }) {
  return (
    <g>
      <path
        d="M28 31 h28 a5 5 0 0 1 5 5 v14 a5 5 0 0 1 -5 5 h-14 l-7 6 v-6 h-7 a5 5 0 0 1 -5 -5 v-14 a5 5 0 0 1 5 -5 z"
        strokeOpacity="0.55"
      />
      <path
        d="M48 44 h21 a4 4 0 0 1 4 4 v11 a4 4 0 0 1 -4 4 h-7 l-5 5 v-5 h-9 a4 4 0 0 1 -4 -4 v-11 a4 4 0 0 1 4 -4 z"
        fill="rgba(0,0,0,0.45)"
      />
      {[55, 60, 65].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy="53.5"
          r="1.6"
          fill="currentColor"
          style={
            front
              ? {
                  animation: `hr-pulse-dot 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.18}s`,
                }
              : undefined
          }
        />
      ))}
    </g>
  );
}

function EmblemDoc({ front }: { front: boolean }) {
  return (
    <g>
      <path
        d="M32 24 h28 l8 8 v44 a2 2 0 0 1 -2 2 h-34 a2 2 0 0 1 -2 -2 v-50 a2 2 0 0 1 2 -2 z"
        strokeOpacity="0.6"
      />
      <path d="M60 24 v8 h8" strokeOpacity="0.45" />
      <line x1="37" y1="44" x2="63" y2="44" strokeOpacity="0.55" />
      <line x1="37" y1="51" x2="63" y2="51" strokeOpacity="0.55" />
      <line x1="37" y1="58" x2="55" y2="58" strokeOpacity="0.55" />
      <line x1="37" y1="65" x2="60" y2="65" strokeOpacity="0.55" />
      <g style={front ? { animation: "hr-pulse-dot 1.8s ease-in-out infinite" } : undefined}>
        <path d="M73 38 v8 M69 42 h8" strokeWidth="2" strokeOpacity="0.95" />
        <path
          d="M73 36 l1.4 4 l4 1.4 l-4 1.4 l-1.4 4 l-1.4 -4 l-4 -1.4 l4 -1.4 z"
          fill="currentColor"
          stroke="none"
          opacity="0.7"
        />
      </g>
    </g>
  );
}

function EmblemRadar({ front }: { front: boolean }) {
  return (
    <g>
      <circle cx="50" cy="50" r="22" strokeOpacity="0.45" />
      <circle cx="50" cy="50" r="14" strokeOpacity="0.55" />
      <circle cx="50" cy="50" r="7" strokeOpacity="0.7" />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        strokeOpacity="0.85"
        style={
          front
            ? {
                transformOrigin: "50px 50px",
                animation: "hr-spin 4s linear infinite",
              }
            : undefined
        }
      />
      <circle cx="50" cy="50" r="2" fill="currentColor" />
      {front && (
        <circle
          cx="50"
          cy="50"
          r="3"
          strokeOpacity="0.7"
          style={{ animation: "hr-ping 1.8s ease-out infinite" }}
        />
      )}
      <line x1="50" y1="30" x2="50" y2="32" strokeOpacity="0.7" />
      <line x1="50" y1="68" x2="50" y2="70" strokeOpacity="0.7" />
      <line x1="30" y1="50" x2="32" y2="50" strokeOpacity="0.7" />
      <line x1="68" y1="50" x2="70" y2="50" strokeOpacity="0.7" />
    </g>
  );
}

function EmblemFunnel({ front }: { front: boolean }) {
  return (
    <g>
      <path d="M30 28 h40 l-12 18 v22 l-16 8 v-30 z" strokeOpacity="0.7" />
      <line x1="34" y1="36" x2="66" y2="36" strokeOpacity="0.35" />
      <circle cx="40" cy="30" r="1.6" fill="currentColor" />
      <circle cx="48" cy="30" r="1.6" fill="currentColor" opacity="0.55" />
      <circle cx="56" cy="30" r="1.6" fill="currentColor" opacity="0.85" />
      <circle cx="64" cy="30" r="1.6" fill="currentColor" opacity="0.35" />
      <g
        transform="translate(50 62)"
        style={front ? { animation: "hr-pulse-dot 1.6s ease-in-out infinite" } : undefined}
      >
        <path
          d="M0 -6 l1.4 4 l4 1.4 l-4 1.4 l-1.4 4 l-1.4 -4 l-4 -1.4 l4 -1.4 z"
          fill="currentColor"
          stroke="none"
        />
      </g>
    </g>
  );
}

// ── StackCard ────────────────────────────────────────────────────────────
function StackCard({
  card,
  pos,
  total,
  onSwipe,
}: {
  card: StackCardData;
  pos: number;
  total: number;
  onSwipe: () => void;
}) {
  const z = total - pos;
  const scale = 1 - pos * 0.06;
  const y = pos * 14;
  const tilt = pos === 0 ? 0 : pos * -2;
  const opacity = pos === 0 ? 1 : pos === 1 ? 0.65 : pos === 2 ? 0.35 : 0;
  const blur = pos === 0 ? 0 : pos * 0.8;

  const elRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, startX: 0, dx: 0 });

  useEffect(() => {
    if (pos !== 0) return;
    const el = elRef.current;
    if (!el) return;
    const set = (dx: number) => {
      el.style.transform = `translate(${dx}px, ${y}px) rotateZ(${dx / 22}deg) scale(${scale})`;
    };
    const start = (e: TouchEvent | MouseEvent) => {
      const t = "touches" in e ? e.touches[0] : (e as MouseEvent);
      dragRef.current = { active: true, startX: t.clientX, dx: 0 };
      el.style.transition = "none";
    };
    const move = (e: TouchEvent | MouseEvent) => {
      if (!dragRef.current.active) return;
      const t = "touches" in e ? e.touches[0] : (e as MouseEvent);
      const dx = t.clientX - dragRef.current.startX;
      dragRef.current.dx = dx;
      set(dx);
    };
    const end = () => {
      if (!dragRef.current.active) return;
      const dx = dragRef.current.dx;
      dragRef.current.active = false;
      el.style.transition = "transform .4s cubic-bezier(.2,.8,.2,1)";
      if (Math.abs(dx) > 60) {
        const dir = dx > 0 ? 1 : -1;
        el.style.transform = `translate(${dir * 420}px, ${y}px) rotateZ(${dir * 24}deg) scale(${scale})`;
        setTimeout(onSwipe, 280);
      } else {
        set(0);
      }
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end);
    el.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("mousedown", start);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
    };
  }, [pos, onSwipe, y, scale]);

  return (
    <div
      ref={elRef}
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        width: 268,
        marginLeft: -134,
        transform: `translate(0px, ${y}px) rotateZ(${tilt}deg) scale(${scale})`,
        transformOrigin: "50% 50%",
        transition: "transform .4s cubic-bezier(.2,.8,.2,1), opacity .35s",
        zIndex: z,
        opacity,
        filter: `blur(${blur}px)`,
        cursor: pos === 0 ? "grab" : "default",
        touchAction: pos === 0 ? "none" : "auto",
      }}
    >
      <div
        style={{
          background: "var(--hr-bg-elev)",
          borderRadius: 22,
          padding: 18,
          position: "relative",
          overflow: "hidden",
          border: pos === 0 ? `1.5px solid ${card.color}` : "1px solid var(--hr-border-1)",
          boxShadow:
            pos === 0
              ? `0 0 0 1px ${card.color}33, 0 30px 60px -20px rgba(0,0,0,0.7), 0 0 30px ${card.color}22`
              : "0 16px 40px -16px rgba(0,0,0,0.6)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${card.color} 0%, transparent 55%)`,
            opacity: pos === 0 ? 0.18 : 0.1,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <CatChip color={card.color}>{card.cat}</CatChip>
          <div
            style={{
              ...monoStyle,
              fontSize: 9,
              color: "var(--hr-fg-3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            агент
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 18,
            marginBottom: 14,
            height: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: card.color,
          }}
        >
          <AgentEmblem kind={card.kind} color={card.color} front={pos === 0} />
        </div>

        <div
          style={{
            position: "relative",
            fontSize: 21,
            fontWeight: 600,
            color: "var(--hr-fg-1)",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
          }}
        >
          {card.title}
        </div>

        <div
          style={{
            position: "relative",
            fontSize: 12.5,
            color: "var(--hr-fg-2)",
            lineHeight: 1.45,
            marginTop: 6,
            minHeight: 36,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {card.sub}
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--hr-border-1)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--hr-fg-1)",
              letterSpacing: "-0.025em",
            }}
          >
            {card.price}
            <span
              style={{
                ...monoStyle,
                fontSize: 9,
                color: "var(--hr-fg-4)",
                fontWeight: 500,
                marginLeft: 4,
              }}
            >
              /мес
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MobileHeroStack ─────────────────────────────────────────────────────
export function MobileHeroStack({ agents }: { agents: Agent[] }) {
  const cards = buildStack(agents);
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || cards.length < 2) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % cards.length);
    }, 4200);
    return () => clearInterval(id);
  }, [auto, cards.length]);

  const onSwipe = () => {
    setAuto(false);
    setIdx((i) => (i + 1) % cards.length);
  };

  const visibleCount = Math.min(3, cards.length);
  const order = Array.from({ length: visibleCount }, (_, off) => cards[(idx + off) % cards.length]);

  const totalCount = agents.filter((a) => a.status === "published" && !a.is_external).length;

  return (
    <section
      style={{
        ...onestStyle,
        position: "relative",
        overflow: "hidden",
        background: "var(--hr-bg-base)",
        color: "var(--hr-fg-1)",
        padding: "28px 18px 36px",
        borderBottom: "1px solid var(--hr-border-1)",
      }}
    >
      <HeroBgFX glow scanlines={false} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <Eyebrow>Маркетплейс AI-агентов</Eyebrow>
        <h1
          style={{
            fontSize: "clamp(36px, 9vw, 44px)",
            fontWeight: 700,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            margin: "14px 0 0",
            color: "var(--hr-fg-1)",
          }}
        >
          Покупай готовые.
          <br />
          <span style={{ color: "var(--hr-teal)" }}>Продавай свои.</span>
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--hr-fg-2)",
            margin: "16px 0 0",
          }}
        >
          Готовые AI-сотрудники для бизнеса. Свайпни — посмотри витрину.
        </p>

        <div
          style={{
            position: "relative",
            height: 420,
            marginTop: 28,
            marginBottom: 8,
          }}
        >
          {order.map((card, pos) => (
            <StackCard
              key={`${card.id}-${idx}-${pos}`}
              card={card}
              pos={pos}
              total={visibleCount}
              onSwipe={onSwipe}
            />
          ))}

          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {cards.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === idx ? 18 : 5,
                  height: 5,
                  borderRadius: 3,
                  background: i === idx ? "var(--hr-teal)" : "var(--hr-border-3)",
                  transition: "all .3s",
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            ...monoStyle,
            fontSize: 9.5,
            color: "var(--hr-fg-4)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: 18,
            marginBottom: 16,
          }}
        >
          ← свайп · витрина {idx + 1} / {cards.length} →
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px 12px",
            marginTop: 8,
            paddingTop: 20,
            borderTop: "1px solid var(--hr-border-1)",
          }}
        >
          <Stat value={String(totalCount)} label="агентов в каталоге" size="sm" />
          <Stat value="5" label="категорий" size="sm" />
          <Stat value="24/7" label="в работе" size="sm" />
          <Stat value="0%" label="комиссия первой волны" accent size="sm" />
        </div>

        <div
          className="hr-hero-ctas"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 22,
          }}
        >
          <PrimaryCTA size="md" href="/agents">
            Найти агента
          </PrimaryCTA>
          <SecondaryCTA size="md" href="/seller">
            Разместить агента
          </SecondaryCTA>
        </div>
      </div>
    </section>
  );
}
