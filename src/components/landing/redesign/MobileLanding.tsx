"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CatChip,
  Eyebrow,
  LiveDot,
  Stat,
  monoStyle,
  onestStyle,
} from "@/components/landing/redesign/shared";
import type { Agent } from "@/components/agents/AgentCard";

// Mobile-полный лендинг (Hireon Redesign 2026-05-16). Рендерится только на
// мобиле (<=880px). Содержит status strip, 3 шага «выбор → подключение →
// работа», мобильный каталог-секцию и блок «для продавцов».
// Footer наследуется глобальный из layout.tsx.

const CAT_TOKEN: Record<string, { label: string; color: string }> = {
  monitoring: { label: "мониторинг", color: "var(--hr-cat-monitoring)" },
  content: { label: "контент", color: "var(--hr-cat-content)" },
  support: { label: "поддержка", color: "var(--hr-cat-support)" },
  analytics: { label: "аналитика", color: "var(--hr-cat-analytics)" },
  sales: { label: "продажи", color: "var(--hr-cat-sales)" },
};
const FALLBACK_CAT = { label: "общее", color: "var(--hr-fg-3)" };

function formatPrice(minor: number | null): string {
  if (!minor || minor <= 0) return "—";
  return `${Math.floor(minor / 100).toLocaleString("ru-RU").replace(/ /g, " ")} ₽`;
}

export function MobileLanding({ agents }: { agents: Agent[] }) {
  return (
    <div className="hr-mobile-only" style={{ ...onestStyle, color: "var(--hr-fg-1)" }}>
      <MobileStatusStrip />
      <MobileThreeSteps />
      <MobileCatalogSection agents={agents} />
      <MobileSellerSection />
      <style jsx>{`
        @media (min-width: 881px) {
          .hr-mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Status strip: «каталог открыт» bar ───────────────────────────────────
function MobileStatusStrip() {
  return (
    <div
      style={{
        ...monoStyle,
        margin: "4px 14px 16px",
        padding: "10px 14px",
        background: "rgba(34,211,238,0.06)",
        border: "1px solid rgba(34,211,238,0.15)",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 10.5,
        color: "var(--hr-fg-2)",
        letterSpacing: "0.02em",
      }}
    >
      <LiveDot size={6} color="var(--hr-teal)" />
      <span>
        <span style={{ color: "var(--hr-fg-1)", fontWeight: 500 }}>
          Каталог открыт
        </span>{" "}
        · регистрация продавцов{" "}
        <span style={{ color: "var(--hr-teal)" }}>бесплатно</span> по заявке
      </span>
    </div>
  );
}

// ── Three steps section ──────────────────────────────────────────────────
function MobileThreeSteps() {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveStep((s) => (s + 1) % 3), 2400);
    return () => clearInterval(id);
  }, []);

  const steps = [
    {
      n: "01",
      tag: "выбор",
      title: "Выбираете",
      copy: "Открываете каталог и выбираете готовый сценарий — с метриками, ценой и описанием.",
      mock: <StepCatalogMock />,
    },
    {
      n: "02",
      tag: "подключение",
      title: "Подключаете",
      copy: "Настройка и интеграции — в кабинете. Без созвонов и переписок с менеджером.",
      mock: <StepSetupMock />,
    },
    {
      n: "03",
      tag: "работа",
      title: "Работает",
      copy: "Живёт в кабинете 24/7. Логи, метрики и контроль — под рукой.",
      mock: <StepCockpitMock />,
    },
  ];

  return (
    <section
      style={{
        padding: "40px 18px 50px",
        borderTop: "1px solid var(--hr-border-1)",
        background: "linear-gradient(180deg, rgba(244,236,222,0.012), transparent 30%)",
      }}
    >
      <div
        style={{
          ...monoStyle,
          fontSize: 10,
          color: "var(--hr-teal)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        ◆ §02
      </div>
      <h2
        style={{
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
          margin: 0,
          color: "var(--hr-fg-1)",
        }}
      >
        От выбора
        <br />
        до запуска —<br />
        <span style={{ color: "var(--hr-fg-3)" }}>три шага.</span>
      </h2>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        {steps.map((s, i) => (
          <div
            key={s.n}
            style={{
              background: "var(--hr-bg-elev)",
              border: "1px solid var(--hr-border-1)",
              borderRadius: 18,
              padding: 20,
              position: "relative",
              overflow: "hidden",
              boxShadow:
                activeStep === i ? "0 0 0 1px rgba(34,211,238,0.25)" : "none",
              transition: "box-shadow .4s",
            }}
          >
            <div
              style={{
                ...monoStyle,
                fontSize: 11,
                color: "var(--hr-fg-3)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {s.n} · {s.tag}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "var(--hr-fg-1)",
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              {s.title}
            </div>
            <p
              style={{
                fontSize: 14.5,
                color: "var(--hr-fg-2)",
                lineHeight: 1.5,
                margin: "12px 0 18px",
              }}
            >
              {s.copy}
            </p>
            {s.mock}
          </div>
        ))}
      </div>
    </section>
  );
}

function StepCatalogMock() {
  const items = [
    {
      tag: "поддержка · telegram",
      sub: "starter",
      title: "Поддержка клиентов",
      price: "4 900 ₽",
    },
    {
      tag: "контент · еженедельно",
      sub: "pro",
      title: "Контент-копирайтер",
      price: "9 900 ₽",
    },
    {
      tag: "ops · uptime",
      sub: "pro",
      title: "Мониторинг сайтов",
      price: "5 900 ₽",
    },
  ];
  return (
    <div
      style={{
        background: "var(--hr-bg-base)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 12,
        padding: 12,
        fontSize: 12,
      }}
    >
      <div
        style={{
          ...monoStyle,
          fontSize: 10,
          color: "var(--hr-fg-3)",
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span>/agents · каталог</span>
        <span>126 рез.</span>
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            padding: "10px 0",
            borderTop: i > 0 ? "1px solid var(--hr-border-1)" : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                ...monoStyle,
                fontSize: 9.5,
                color: "var(--hr-fg-3)",
                letterSpacing: "0.06em",
                display: "flex",
                gap: 6,
              }}
            >
              <span>{it.tag}</span>
              <span style={{ color: "var(--hr-teal)" }}>· {it.sub}</span>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "var(--hr-fg-1)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {it.title}
            </div>
          </div>
          <div
            style={{
              ...monoStyle,
              fontSize: 11.5,
              color: "var(--hr-fg-1)",
              whiteSpace: "nowrap",
            }}
          >
            {it.price}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepSetupMock() {
  const rows = [
    { k: "api_key", tag: "encrypted", v: "sk-ag-pj4···k82q" },
    { k: "telegram_bot_token", tag: "", v: "7421:AAH···xQ" },
    { k: "schedule", tag: "каждые 2 мин", v: "*/2 * * * *" },
    { k: "crm", tag: "", v: "amoCRM · prod" },
  ];
  return (
    <div
      style={{
        background: "var(--hr-bg-base)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          ...monoStyle,
          fontSize: 10,
          color: "var(--hr-fg-3)",
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span>/agents/ai-support</span>
        <span>шаг 2 / 3</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ ...monoStyle, fontSize: 11, color: "var(--hr-fg-2)" }}>
              {r.k}{" "}
              {r.tag && (
                <span style={{ color: "var(--hr-fg-3)" }}>· {r.tag}</span>
              )}
            </div>
            <div
              style={{
                ...monoStyle,
                fontSize: 10.5,
                color: "var(--hr-fg-1)",
                background: "var(--hr-bg-elev-2)",
                padding: "3px 7px",
                borderRadius: 4,
              }}
            >
              {r.v}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          ...monoStyle,
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--hr-border-1)",
          fontSize: 10.5,
          color: "var(--hr-fg-2)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "var(--hr-cat-monitoring)" }}>
          ✓ api_key · валиден
        </span>
        <span style={{ color: "var(--hr-teal)" }}>~4 сек до запуска →</span>
      </div>
    </div>
  );
}

function StepCockpitMock() {
  const log = [
    { t: "12:04:58", k: "INTAKE", c: "var(--hr-cat-analytics)", m: "msg @ivan_k → support" },
    { t: "12:05:01", k: "REPLY", c: "var(--hr-cat-monitoring)", m: "response · 1.4s" },
    { t: "12:05:03", k: "CRM", c: "var(--hr-cat-content)", m: "updated #4821" },
    { t: "12:05:07", k: "INTAKE", c: "var(--hr-cat-analytics)", m: "msg @marina → qualify" },
    { t: "12:05:14", k: "TOOL", c: "var(--hr-cat-support)", m: "calendar.book вт 15:30" },
  ];
  return (
    <div
      style={{
        background: "var(--hr-bg-base)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-3)",
            letterSpacing: "0.08em",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          cockpit · <LiveDot size={4} color="var(--hr-teal)" />{" "}
          <span style={{ color: "var(--hr-fg-2)" }}>live</span>
        </div>
        <div style={{ ...monoStyle, fontSize: 10, color: "var(--hr-fg-1)" }}>
          12 847 событий
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          marginBottom: 10,
        }}
      >
        {[
          ["uptime", "99.94%"],
          ["msg·24h", "1 284"],
          ["resp", "1.2с"],
        ].map(([k, v], i) => (
          <div
            key={i}
            style={{
              background: "var(--hr-bg-elev-2)",
              padding: "7px 9px",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                ...monoStyle,
                fontSize: 9,
                color: "var(--hr-fg-3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {k}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--hr-fg-1)",
                marginTop: 2,
                letterSpacing: "-0.02em",
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          ...monoStyle,
          fontSize: 9.5,
          lineHeight: 1.6,
          color: "var(--hr-fg-2)",
          maxHeight: 120,
          overflow: "hidden",
        }}
      >
        {log.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <span style={{ color: "var(--hr-fg-4)" }}>{l.t}</span>
            <span style={{ color: l.c, fontWeight: 500, width: 50 }}>{l.k}</span>
            <span style={{ color: "var(--hr-fg-1)" }}>✓ {l.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Catalog section ──────────────────────────────────────────────────────
function MobileCatalogSection({ agents }: { agents: Agent[] }) {
  const items = agents
    .filter((a) => a.status === "published" && !a.is_external)
    .slice(0, 3)
    .map((a) => {
      const cat = CAT_TOKEN[a.category || ""] || FALLBACK_CAT;
      return {
        slug: a.slug,
        cat: cat.label,
        color: cat.color,
        title: a.name,
        price: formatPrice(a.price_monthly),
        desc: a.description || "Готовый AI-агент. Подключите за пару кликов.",
      };
    });
  const totalCount = agents.filter(
    (a) => a.status === "published" && !a.is_external,
  ).length;

  return (
    <section
      style={{
        padding: "40px 18px 50px",
        borderTop: "1px solid var(--hr-border-1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 22,
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            margin: 0,
            color: "var(--hr-fg-1)",
          }}
        >
          Каталог
          <br />
          агентов.
        </h2>
        <Link
          href="/agents"
          style={{
            ...monoStyle,
            fontSize: 10.5,
            color: "var(--hr-teal)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          все {totalCount} →
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <Link
            key={i}
            href={`/agents/${it.slug}`}
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              background: "var(--hr-bg-elev)",
              borderRadius: 16,
              padding: 18,
              borderTop: `2px solid ${it.color}`,
              border: "1px solid var(--hr-border-1)",
              position: "relative",
              overflow: "hidden",
              isolation: "isolate",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                zIndex: -1,
                background: `linear-gradient(180deg, ${it.color} 0%, transparent 60%)`,
                opacity: 0.08,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <CatChip color={it.color}>{it.cat}</CatChip>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--hr-fg-1)" }}>
                {it.price}
                <span
                  style={{
                    ...monoStyle,
                    fontSize: 10,
                    color: "var(--hr-fg-3)",
                    fontWeight: 500,
                    marginLeft: 4,
                  }}
                >
                  /мес
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--hr-fg-1)",
                marginTop: 10,
                letterSpacing: "-0.02em",
              }}
            >
              {it.title}
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--hr-fg-2)",
                lineHeight: 1.5,
                margin: "8px 0 12px",
              }}
            >
              {it.desc}
            </p>
            <div
              style={{
                marginTop: 6,
                paddingTop: 12,
                borderTop: "1px solid var(--hr-border-1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  ...monoStyle,
                  fontSize: 10.5,
                  color: "var(--hr-fg-3)",
                  letterSpacing: "0.06em",
                }}
              >
                подробнее в карточке
              </span>
              <span
                style={{
                  ...monoStyle,
                  fontSize: 10.5,
                  color: "var(--hr-teal)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                подключить →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Seller section ───────────────────────────────────────────────────────
function MobileSellerSection() {
  return (
    <section
      style={{
        padding: "50px 18px 60px",
        borderTop: "1px solid var(--hr-border-1)",
        background: "linear-gradient(180deg, rgba(34,211,238,0.04), transparent 40%)",
      }}
    >
      <Eyebrow color="var(--hr-cat-sales)">Для продавцов</Eyebrow>
      <h2
        style={{
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: "-0.035em",
          margin: "16px 0 0",
          color: "var(--hr-fg-1)",
        }}
      >
        Публикуете
        <br />
        один раз.
        <br />
        <span style={{ color: "var(--hr-teal)" }}>
          Продаёт
          <br />
          площадка.
        </span>
      </h2>
      <p
        style={{
          fontSize: 15.5,
          lineHeight: 1.55,
          color: "var(--hr-fg-2)",
          margin: "22px 0 0",
        }}
      >
        Загружаете продукт, назначаете цену, продаёте напрямую —{" "}
        <span style={{ color: "var(--hr-fg-1)" }}>0% комиссии</span>. Каталог,
        путь покупателя и контакт с продавцом уже собраны.
      </p>

      <div
        style={{
          marginTop: 26,
          background: "var(--hr-bg-elev)",
          border: "1px solid var(--hr-border-1)",
          borderRadius: 18,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                ...monoStyle,
                fontSize: 10,
                color: "var(--hr-fg-3)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              выплата
            </div>
            <div style={{ fontSize: 13, color: "var(--hr-fg-2)", marginTop: 4 }}>
              апрель 2026
            </div>
          </div>
          <div
            style={{
              ...monoStyle,
              fontSize: 10.5,
              color: "var(--hr-cat-monitoring)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              background: "rgba(74,222,128,0.08)",
              borderRadius: 999,
            }}
          >
            +24% к мар
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginTop: 16,
          }}
        >
          <span style={{ ...monoStyle, fontSize: 12, color: "var(--hr-fg-3)" }}>
            Выплачено
          </span>
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "var(--hr-fg-1)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginTop: 6,
          }}
        >
          167 000
          <span
            style={{
              fontSize: 24,
              color: "var(--hr-teal)",
              marginLeft: 4,
            }}
          >
            ₽
          </span>
        </div>
        <div
          style={{
            marginTop: 18,
            padding: "12px 0",
            borderTop: "1px solid var(--hr-border-1)",
            borderBottom: "1px solid var(--hr-border-1)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {[
            ["Прямые продажи", "167 000 ₽", false],
            ["Комиссия площадки", "0 ₽", true],
          ].map(([k, v, hi], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ ...monoStyle, fontSize: 11, color: "var(--hr-fg-2)" }}>
                {k}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: hi ? "var(--hr-teal)" : "var(--hr-fg-1)",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 16,
          }}
        >
          <Stat value="47" label="продаж" />
          <Stat value="31" label="активных" />
        </div>
      </div>

      <Link
        href="/seller"
        style={{
          marginTop: 22,
          width: "100%",
          background: "var(--hr-teal)",
          color: "#062e36",
          padding: "16px 22px",
          borderRadius: 14,
          fontWeight: 600,
          fontSize: 16,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          textDecoration: "none",
        }}
      >
        Стать продавцом
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
      <div
        style={{
          ...monoStyle,
          marginTop: 10,
          fontSize: 10.5,
          color: "var(--hr-fg-3)",
          letterSpacing: "0.08em",
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        0% комиссии · прямые продажи · набор первой волны
      </div>
    </section>
  );
}
