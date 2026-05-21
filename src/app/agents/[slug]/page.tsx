import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { PurchaseButton } from "@/components/agents/PurchaseButton";
import { ExternalAgentCTA } from "@/components/agents/ExternalAgentCTA";
import { WaitlistCTA } from "@/components/agents/WaitlistCTA";
import { AgentIcon, hasAgentIcon } from "@/components/agents/AgentIcon";
import { categoryColor, categoryLabel } from "@/lib/category-color";

// БД-данные (long_description, features, price, fits/not_fits) часто
// редактируются админом через SQL. force-dynamic = всегда свежий запрос
// в БД, без передеплоя.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const LI_ORANGE = "#ff5722";

// ── helpers ───────────────────────────────────────────────────────────────

function fmtPrice(kopecks: number | null | undefined): string | null {
  if (kopecks == null) return null;
  return `${(kopecks / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}

// Generic иконки для feature-карточек. Циклически крутятся для списка
// features (1-5 пунктов на агента) пока не появятся per-feature SVG в БД.
const FEATURE_ICONS: string[] = [
  "M5 13l4 4L19 7", // check
  "M12 3v18M3 12h18", // plus / cross
  "M4 20V4M4 20h16M8 16V10M12 16V6M16 16V12", // bar chart
  "M3 12h6l3-9 3 18 3-9h3", // pulse
  "M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5", // layers
];

function FeatureIcon({ path, color }: { path: string; color: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <path
          d={path}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── Hero illustration ─────────────────────────────────────────────────────
// Для агентов с AgentIcon (content-writer, competitor-monitor, news-digest-bot)
// показываем масштабированную иконку в cyan-framed контейнере.
// Для остальных — generic placeholder с инициалом slug'а на cyan-glow.

function HeroIllustration({
  slug,
  name,
  color,
}: {
  slug: string;
  name: string;
  color: string;
}) {
  const iconAvailable = hasAgentIcon(slug);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 18,
        padding: 48,
        background: `linear-gradient(135deg, color-mix(in oklch, ${color} 14%, transparent), color-mix(in oklch, ${color} 2%, transparent))`,
        border: `1px solid color-mix(in oklch, ${color} 22%, transparent)`,
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Радиальное cyan-сияние позади */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 45%, color-mix(in oklch, ${color} 18%, transparent), transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", color }}>
        {iconAvailable ? (
          <AgentIcon slug={slug} size={220} />
        ) : (
          <div
            style={{
              fontFamily: "var(--font-onest), 'Onest', sans-serif",
              fontSize: 200,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color,
              opacity: 0.85,
            }}
          >
            {name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [agent] = await db
    .select({ name: agents.name, description: agents.description })
    .from(agents)
    .where(and(eq(agents.slug, slug), eq(agents.status, "published")))
    .limit(1);

  if (!agent) return { title: "Агент не найден" };
  return {
    title: `${agent.name} - hireon`,
    description: agent.description ?? undefined,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function AgentPage({ params }: { params: Params }) {
  const { slug } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.slug, slug), eq(agents.status, "published")))
    .limit(1);

  if (!agent) notFound();

  const user = await getUser();

  let sellerName: string | null = null;
  if (agent.sellerId) {
    const [seller] = await db
      .select({ name: profiles.name })
      .from(profiles)
      .where(eq(profiles.id, agent.sellerId))
      .limit(1);
    sellerName = seller?.name ?? null;
  }

  const cc = categoryColor(agent.category);
  const catLabel = categoryLabel(agent.category).toLowerCase();

  const isExternal = !!agent.sellerId;
  const isLockIn = !isExternal && agent.brand === "lock_in";

  const features: string[] = Array.isArray(agent.features)
    ? (agent.features as string[])
    : [];
  const fitsFor: string[] = agent.fitsFor ?? [];
  const notFitsFor: string[] = agent.notFitsFor ?? [];
  const setupFields = Array.isArray(agent.setupSchema)
    ? (agent.setupSchema as { key: string; label: string; type: string; required?: boolean }[])
    : [];

  const formattedPrice = fmtPrice(agent.priceMonthly);

  // Параграфы long_description — для блока "Как работает".
  const longParagraphs = (agent.longDescription || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Setup steps — берём labels из setup_schema (первые 3) + добавляем
  // финальный шаг «оплата → запуск». Технические названия остаются как есть.
  const setupSteps = setupFields.slice(0, 2).map((f, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: f.label || f.key,
    desc: f.required === false
      ? "Опциональная настройка — можно пропустить и выставить позже."
      : "Заполните в setup-визарде после оплаты подписки.",
  }));
  setupSteps.push({
    n: String(setupSteps.length + 1).padStart(2, "0"),
    title: "Оплата и запуск",
    desc: "Оплатите подписку картой или криптой. Контейнер агента стартует автоматически.",
  });

  return (
    <div
      style={{
        position: "relative",
        background: "var(--hr-bg-base)",
        color: "var(--hr-fg-1)",
        minHeight: "calc(100vh - 200px)",
        isolation: "isolate",
      }}
    >
      {/* Soft cyan ambient at the top, like Linear / Stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 600,
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* ═══ HERO ═══ */}
        <section
          style={{
            padding: "64px 0 56px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
            gap: 56,
            alignItems: "center",
          }}
          className="agent-v3-hero"
        >
          <div>
            {/* Eyebrow — категория с цветной точкой */}
            <span
              className="font-mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: cc,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: cc,
                }}
              />
              {catLabel}
            </span>

            <h1
              style={{
                margin: "22px 0 0",
                fontFamily: "var(--font-onest), 'Onest', sans-serif",
                fontSize: "clamp(40px, 5.8vw, 72px)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                color: "var(--hr-fg-1)",
              }}
            >
              {agent.name}
              <span style={{ color: cc }}>.</span>
            </h1>

            {agent.description && (
              <p
                style={{
                  margin: "24px 0 0",
                  maxWidth: 540,
                  fontSize: 21,
                  lineHeight: 1.45,
                  color: "var(--hr-fg-2)",
                  fontWeight: 400,
                  letterSpacing: "-0.005em",
                }}
              >
                {agent.description}
              </p>
            )}

            {/* Author badge */}
            <div
              style={{
                marginTop: 30,
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              {isLockIn ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    background: "rgba(255,87,34,0.10)",
                    border: `1px solid ${LI_ORANGE}`,
                    borderRadius: 999,
                    fontFamily: "var(--font-geist), sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: LI_ORANGE,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: LI_ORANGE }} />
                  built by{" "}
                  <span style={{ color: "#f1ebe0", fontWeight: 700, letterSpacing: "0.06em" }}>
                    [LOCK·IN]
                  </span>
                </span>
              ) : isExternal && sellerName ? (
                <span
                  className="font-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: "var(--hr-bg-elev)",
                    border: "1px solid var(--hr-border-2)",
                    borderRadius: 999,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--hr-fg-2)",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: cc }} />
                  продавец · {sellerName}
                </span>
              ) : (
                <span
                  className="font-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: "var(--hr-bg-elev)",
                    border: "1px solid var(--hr-border-2)",
                    borderRadius: 999,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--hr-fg-2)",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--hr-teal)" }} />
                  агент от hireon
                </span>
              )}

              {agent.purchasesCount >= 3 && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: "var(--hr-fg-4)",
                    letterSpacing: "0.04em",
                  }}
                >
                  · подключений · {agent.purchasesCount}
                </span>
              )}
            </div>

            {/* CTA row — на mobile рендерится PurchaseButton-в-aside,
                здесь только smooth-scroll-якорь "Подробнее ↓" */}
            <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {!isExternal && !agent.waitlistOnly && formattedPrice && (
                <a
                  href="#buy"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "16px 24px",
                    background: cc,
                    color: "#0a0a09",
                    borderRadius: 12,
                    fontFamily: "var(--font-geist), sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                  }}
                >
                  Подключить за {formattedPrice}
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
              <a
                href="#how"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px 22px",
                  background: "transparent",
                  color: "var(--hr-fg-1)",
                  border: "1px solid var(--hr-border-2)",
                  borderRadius: 12,
                  fontFamily: "var(--font-geist), sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Подробнее ↓
              </a>
            </div>

            <div
              className="font-mono"
              style={{
                marginTop: 24,
                display: "flex",
                gap: 22,
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--hr-fg-4)",
                flexWrap: "wrap",
              }}
            >
              <span>● запуск в один клик</span>
              <span>● отмена в любое время</span>
              <span>● оплата ₽ / USDT</span>
            </div>
          </div>

          {/* RIGHT — hero illustration */}
          <div>
            <HeroIllustration slug={agent.slug} name={agent.name} color={cc} />
          </div>
        </section>

        {/* ═══ ЧТО ВНУТРИ — features ═══ */}
        {features.length > 0 && (
          <section style={{ padding: "40px 0 0" }}>
            <div style={{ paddingTop: 36, borderTop: "1px solid var(--hr-border-1)" }}>
              <span
                className="font-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--hr-teal)",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--hr-teal)" }} />
                что внутри
              </span>
              <h2
                style={{
                  margin: "16px 0 0",
                  fontFamily: "var(--font-onest), 'Onest', sans-serif",
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                }}
              >
                {features.length === 1
                  ? "одна ключевая функция"
                  : `${features.length} функций, которые работают сразу`}
              </h2>
              <p
                style={{
                  margin: "14px 0 0",
                  maxWidth: 600,
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: "var(--hr-fg-3)",
                }}
              >
                Подключаешь — и не нужно ничего настраивать дальше. Каждая функция работает из коробки.
              </p>

              <div
                style={{
                  marginTop: 40,
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(features.length, 5)}, 1fr)`,
                  gap: 16,
                }}
                className="agent-v3-features"
              >
                {features.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--hr-bg-elev)",
                      border: "1px solid var(--hr-border-1)",
                      borderRadius: 14,
                      padding: "22px 20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <FeatureIcon path={FEATURE_ICONS[i % FEATURE_ICONS.length]} color={cc} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14.5,
                        lineHeight: 1.5,
                        color: "var(--hr-fg-1)",
                        fontWeight: 500,
                      }}
                    >
                      {f}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ КАК РАБОТАЕТ + sticky buy aside ═══ */}
        <section id="how" style={{ padding: "80px 0 0", scrollMarginTop: 80 }}>
          <div style={{ paddingTop: 36, borderTop: "1px solid var(--hr-border-1)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 360px",
                gap: 64,
                alignItems: "flex-start",
              }}
              className="agent-v3-how"
            >
              {/* MAIN — long-form */}
              <div>
                <span
                  className="font-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--hr-teal)",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--hr-teal)" }} />
                  как работает
                </span>
                <h2
                  style={{
                    margin: "16px 0 28px",
                    fontFamily: "var(--font-onest), 'Onest', sans-serif",
                    fontSize: "clamp(28px, 3.5vw, 42px)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                  }}
                >
                  раньше это занимало день — теперь происходит само
                </h2>

                <div
                  style={{
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: "var(--hr-fg-2)",
                    maxWidth: 640,
                    display: "flex",
                    flexDirection: "column",
                    gap: 22,
                  }}
                >
                  {longParagraphs.length > 0 ? (
                    longParagraphs.map((p, i) => (
                      <p key={i} style={{ margin: 0 }}>
                        {p.replace(/\*\*/g, "")}
                      </p>
                    ))
                  ) : (
                    <p style={{ margin: 0 }}>{agent.description}</p>
                  )}
                </div>
              </div>

              {/* ASIDE — sticky buy-card */}
              <aside
                id="buy"
                style={{
                  position: "sticky",
                  top: 24,
                  background: "var(--hr-bg-elev)",
                  border: "1px solid var(--hr-border-1)",
                  borderTop: `3px solid ${cc}`,
                  borderRadius: 14,
                  padding: "26px 26px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  scrollMarginTop: 80,
                }}
                className="agent-v3-aside"
              >
                {!isExternal && !agent.waitlistOnly && formattedPrice && (
                  <div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--hr-fg-4)",
                        marginBottom: 8,
                      }}
                    >
                      ежемесячная подписка
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-onest), 'Onest', sans-serif",
                          fontSize: 52,
                          fontWeight: 800,
                          letterSpacing: "-0.035em",
                          color: "var(--hr-fg-1)",
                          lineHeight: 1,
                        }}
                      >
                        {formattedPrice}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 13,
                          color: "var(--hr-fg-3)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        /мес
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "12px 0 0",
                        fontSize: 13,
                        color: "var(--hr-fg-3)",
                        lineHeight: 1.5,
                      }}
                    >
                      Хостинг и AI включены. Без скрытых платежей. Отмена в один клик.
                    </p>
                  </div>
                )}

                {isExternal ? (
                  <ExternalAgentCTA externalUrl={agent.externalUrl} sellerName={sellerName} />
                ) : agent.waitlistOnly ? (
                  <WaitlistCTA agentId={agent.id} agentName={agent.name} accentColor={cc} />
                ) : (
                  <PurchaseButton
                    agentId={agent.id}
                    pricingModel="subscription"
                    priceMonthly={agent.priceMonthly}
                    priceOnetime={null}
                    isLoggedIn={!!user}
                    accentColor={cc}
                  />
                )}

                <div style={{ paddingTop: 16, borderTop: "1px solid var(--hr-border-1)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ["категория", <span key="c" style={{ color: cc }}>{catLabel}</span>],
                      ["автор", isLockIn ? (
                        <span key="a" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 99, background: LI_ORANGE }} />
                          <span style={{ color: LI_ORANGE, fontWeight: 600 }}>LOCK·IN</span>
                        </span>
                      ) : isExternal && sellerName ? (
                        <span key="a" style={{ color: "var(--hr-fg-1)" }}>{sellerName}</span>
                      ) : (
                        <span key="a" style={{ color: "var(--hr-fg-1)" }}>hireon</span>
                      )],
                      ["запуск", "1 клик"],
                      ["оплата", isExternal ? "у продавца" : "карта РФ · USDT"],
                    ].map(([k, v]) => (
                      <div
                        key={String(k)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                          fontSize: 11.5,
                          letterSpacing: "0.02em",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--hr-fg-4)",
                            textTransform: "uppercase",
                            letterSpacing: "0.14em",
                            fontSize: 10,
                          }}
                        >
                          {k}
                        </span>
                        <span style={{ color: "var(--hr-fg-1)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ═══ ПОДХОДИТ / НЕ ПОДХОДИТ ═══ */}
        {(fitsFor.length > 0 || notFitsFor.length > 0) && (
          <section style={{ padding: "80px 0 0" }}>
            <div style={{ paddingTop: 36, borderTop: "1px solid var(--hr-border-1)" }}>
              <span
                className="font-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--hr-teal)",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--hr-teal)" }} />
                подходит / не подходит
              </span>
              <h2
                style={{
                  margin: "16px 0 32px",
                  fontFamily: "var(--font-onest), 'Onest', sans-serif",
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                }}
              >
                где {agent.name} работает хорошо
              </h2>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}
                className="agent-v3-fits"
              >
                {/* DO */}
                {fitsFor.length > 0 && (
                  <div
                    style={{
                      background: "var(--hr-bg-elev)",
                      border: "1px solid rgba(34,211,238,0.25)",
                      borderRadius: 14,
                      padding: "26px 28px",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 12px",
                        background: "rgba(34,211,238,0.10)",
                        border: "1px solid rgba(34,211,238,0.30)",
                        borderRadius: 999,
                        marginBottom: 18,
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="var(--hr-teal)"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--hr-teal)",
                        }}
                      >
                        подходит, если
                      </span>
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      {fitsFor.map((t, i) => (
                        <li
                          key={i}
                          style={{
                            display: "flex",
                            gap: 14,
                            alignItems: "flex-start",
                            fontSize: 15,
                            lineHeight: 1.5,
                            color: "var(--hr-fg-1)",
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 99,
                              flexShrink: 0,
                              background: "var(--hr-teal)",
                              color: "var(--hr-teal-ink)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 3,
                            }}
                          >
                            <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                              <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                strokeWidth={3.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DON'T */}
                {notFitsFor.length > 0 && (
                  <div
                    style={{
                      background: "var(--hr-bg-elev)",
                      border: "1px solid var(--hr-border-1)",
                      borderRadius: 14,
                      padding: "26px 28px",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 12px",
                        background: "rgba(241,235,224,0.04)",
                        border: "1px solid var(--hr-border-2)",
                        borderRadius: 999,
                        marginBottom: 18,
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="var(--hr-fg-3)"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--hr-fg-3)",
                        }}
                      >
                        не подходит, если
                      </span>
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      {notFitsFor.map((t, i) => (
                        <li
                          key={i}
                          style={{
                            display: "flex",
                            gap: 14,
                            alignItems: "flex-start",
                            fontSize: 15,
                            lineHeight: 1.5,
                            color: "var(--hr-fg-3)",
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 99,
                              flexShrink: 0,
                              background: "var(--hr-bg-elev-3)",
                              color: "var(--hr-fg-3)",
                              border: "1px solid var(--hr-border-2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 3,
                            }}
                          >
                            <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                              <path
                                d="M18 6L6 18M6 6l12 12"
                                stroke="currentColor"
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ═══ КАК НАЧАТЬ — 3 шага из setup_schema ═══ */}
        {setupSteps.length > 0 && (
          <section style={{ padding: "80px 0 0" }}>
            <div style={{ paddingTop: 36, borderTop: "1px solid var(--hr-border-1)" }}>
              <span
                className="font-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--hr-teal)",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--hr-teal)" }} />
                как начать
              </span>
              <h2
                style={{
                  margin: "16px 0 32px",
                  fontFamily: "var(--font-onest), 'Onest', sans-serif",
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                }}
              >
                {setupSteps.length} {setupSteps.length === 1 ? "шаг" : setupSteps.length < 5 ? "шага" : "шагов"} — десять минут
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${setupSteps.length}, 1fr)`,
                  gap: 18,
                }}
                className="agent-v3-steps"
              >
                {setupSteps.map((s) => (
                  <div
                    key={s.n}
                    style={{
                      background: "var(--hr-bg-elev)",
                      border: "1px solid var(--hr-border-1)",
                      borderRadius: 14,
                      padding: "26px 28px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: -10,
                        right: 0,
                        fontFamily: "var(--font-onest), 'Onest', sans-serif",
                        fontSize: 96,
                        fontWeight: 800,
                        letterSpacing: "-0.05em",
                        color: "color-mix(in oklch, var(--hr-teal) 10%, transparent)",
                        lineHeight: 1,
                      }}
                    >
                      {s.n}
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.18em",
                        color: cc,
                        marginBottom: 14,
                        textTransform: "uppercase",
                      }}
                    >
                      шаг {s.n}
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-onest), 'Onest', sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.title}
                    </h3>
                    <p
                      style={{
                        margin: "10px 0 0",
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "var(--hr-fg-3)",
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ FINAL CTA ═══ */}
        {!isExternal && !agent.waitlistOnly && formattedPrice && (
          <section style={{ padding: "80px 0 80px" }}>
            <div
              style={{
                padding: "44px 48px",
                background: "var(--hr-bg-elev)",
                border: "1px solid var(--hr-border-1)",
                borderRadius: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 40,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-onest), 'Onest', sans-serif",
                    fontSize: "clamp(24px, 3vw, 36px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                  }}
                >
                  Готовы попробовать?
                </h2>
                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: 16,
                    color: "var(--hr-fg-3)",
                    lineHeight: 1.45,
                    maxWidth: 540,
                  }}
                >
                  Подключаете сейчас — агент стартует в течение минуты. Без разработчиков, без интеграций.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <a
                  href="#buy"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "16px 24px",
                    background: cc,
                    color: "#0a0a09",
                    borderRadius: 12,
                    fontFamily: "var(--font-geist), sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Подключить за {formattedPrice}
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Mobile responsiveness */}
      <style>{`
        @media (max-width: 880px) {
          .agent-v3-hero { grid-template-columns: 1fr !important; }
          .agent-v3-how { grid-template-columns: 1fr !important; }
          .agent-v3-aside { position: static !important; }
          .agent-v3-features { grid-template-columns: 1fr 1fr !important; }
          .agent-v3-fits { grid-template-columns: 1fr !important; }
          .agent-v3-steps { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .agent-v3-features { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
