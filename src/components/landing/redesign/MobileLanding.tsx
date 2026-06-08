"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CatChip,
  Eyebrow,
  LiveDot,
  Stat,
  monoStyle,
  sansStyle,
} from "@/components/landing/redesign/shared";
import { MobileHeroStack } from "@/components/landing/redesign/MobileHeroStack";
import type { Agent } from "@/components/agents/AgentCard";

// Mobile-полный лендинг (Hireon Redesign 2026-05-16, hero+процесс обновлены
// 2026-06-08). Рендерится только на мобиле (<=880px). Содержит hero,
// процесс «выбор → подключение → работа», мобильный каталог-секцию и блок
// «для продавцов». Footer наследуется глобальный из layout.tsx. Шрифт всей
// мобильной страницы — системный гротеск (sansStyle), не Onest.

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
    <div className="hr-mobile-only" style={{ ...sansStyle, color: "var(--hr-fg-1)" }}>
      <MobileHeroStack />
      <MobileProcess />
      <MobileCatalogSection agents={agents} />
      <MobileSellerSection />
    </div>
  );
}

// ── Process section — леджер из Direction 2 (Hireon Design 2026-06-08) ────
// Шаги разделены воздухом — линии-разделители между шагами убраны по просьбе
// founder'а (2026-06-08); рамка только сверху/снизу всей секции. Моки в
// браузер-окне, без номеров шагов и выдуманных метрик. Эйбрау «Процесс» убран.
// Один живой акцент — pulse-точка «в работе» в последнем шаге.
function MobileProcess() {
  return (
    <section
      style={{
        borderTop: "1px solid var(--hr-border-1)",
        padding: "52px 0 52px",
      }}
    >
      <div style={{ padding: "0 18px" }}>
        <h2
          className="hr-mlx-h2"
          style={{
            margin: 0,
            fontSize: 32,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            fontWeight: 700,
            color: "var(--hr-fg-1)",
            maxWidth: "17ch",
          }}
        >
          От выбора до запуска&nbsp;-{" "}
          <span style={{ color: "var(--hr-teal)" }}>три&nbsp;шага</span>.
        </h2>
      </div>

      <ProcessStep
        title="Выбираете"
        tag="каталог"
        desc="Открываете каталог и берёте готовый сценарий под свою задачу."
      >
        <WinCatalog />
      </ProcessStep>

      <ProcessStep
        title="Подключаете"
        tag="настройка"
        desc="Вводите доступы и параметры прямо в кабинете - без созвонов с менеджером."
      >
        <WinConfig />
      </ProcessStep>

      <ProcessStep
        title="Работает"
        tag="кабинет"
        desc="Агент живёт в кабинете и делает работу. Что он сделал - видно в ленте."
      >
        <WinLog />
      </ProcessStep>
    </section>
  );
}

function ProcessStep({
  title,
  tag,
  desc,
  children,
}: {
  title: string;
  tag: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        padding: "0 18px",
        marginTop: 44,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 23,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--hr-fg-1)",
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--hr-fg-4)",
            flex: "none",
          }}
        >
          {tag}
        </span>
      </div>
      <p
        className="hr-mlx-desc"
        style={{
          margin: "10px 0 0",
          fontSize: 14.5,
          lineHeight: 1.5,
          color: "var(--hr-fg-3)",
          maxWidth: "42ch",
        }}
      >
        {desc}
      </p>
      {children}
    </div>
  );
}

// Браузер-окно мока: бар с «светофором» + url ИЛИ live-индикатор.
function Win({
  url,
  live = false,
  children,
}: {
  url?: ReactNode;
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 20,
        background: "var(--hr-bg-elev)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 22px 50px -26px rgba(0,0,0,0.7)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 14px",
          borderBottom: "1px solid var(--hr-border-1)",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#2a2622",
              }}
            />
          ))}
        </div>
        {live ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11.5,
              color: "var(--hr-fg-3)",
            }}
          >
            <LiveDot size={6} color="var(--hr-teal)" />
            в работе
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--hr-fg-3)" }}>{url}</span>
        )}
      </div>
      {children}
    </div>
  );
}

const winHost = (
  <span style={{ color: "var(--hr-fg-2)", fontWeight: 500 }}>hireon.agency</span>
);

function WinCatalog() {
  const rows = [
    { chip: "поддержка", nm: "Поддержка в Telegram", pr: "4 900" },
    { chip: "контент", nm: "Контент-редактор", pr: "9 900" },
    { chip: "мониторинг", nm: "Мониторинг сайта", pr: "5 900" },
  ];
  return (
    <Win url={<>{winHost}/agents</>}>
      {rows.map((r, i) => (
        <Link
          key={i}
          href="/agents"
          style={{
            display: "grid",
            gridTemplateColumns: "98px 1fr auto",
            alignItems: "center",
            gap: 10,
            padding: "13px 14px",
            borderTop: i > 0 ? "1px solid var(--hr-border-1)" : "none",
            background: "transparent",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--hr-fg-2)",
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid var(--hr-border-2)",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {r.chip}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--hr-fg-1)",
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.nm}
          </span>
          <span
            style={{ fontSize: 13.5, color: "var(--hr-fg-2)", whiteSpace: "nowrap" }}
          >
            <b style={{ color: "var(--hr-fg-1)", fontWeight: 600 }}>{r.pr}</b> ₽
          </span>
        </Link>
      ))}
    </Win>
  );
}

function WinConfig() {
  const rows = [
    { k: "Telegram-бот", v: "подключён" },
    { k: "Расписание", v: "круглосуточно" },
    { k: "CRM", v: "amoCRM" },
  ];
  return (
    <Win url={<>{winHost}/setup</>}>
      <div style={{ padding: "6px 14px 12px" }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: "12px 0",
              borderBottom:
                i < rows.length - 1 ? "1px solid var(--hr-border-1)" : "none",
            }}
          >
            <span style={{ fontSize: 13.5, color: "var(--hr-fg-3)" }}>{r.k}</span>
            <span
              style={{
                fontSize: 13,
                color: "var(--hr-fg-1)",
                background: "var(--hr-bg-elev-2)",
                padding: "4px 10px",
                borderRadius: 7,
                maxWidth: "58%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 14,
          borderTop: "1px solid var(--hr-border-1)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            fontSize: 13,
            color: "var(--hr-fg-3)",
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid var(--hr-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--hr-teal)",
              fontSize: 10,
              flex: "none",
            }}
          >
            ✓
          </span>
          доступы проверяются
        </span>
        <Link
          href="/agents"
          className="hr-mlx-btn"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#14110d",
            background: "var(--hr-fg-1)",
            padding: "9px 16px",
            borderRadius: 9,
            whiteSpace: "nowrap",
            textDecoration: "none",
          }}
        >
          Подключить
        </Link>
      </div>
    </Win>
  );
}

function WinLog() {
  const lines: { when: string; act: ReactNode }[] = [
    {
      when: "только что",
      act: (
        <>
          Ответил клиенту в{" "}
          <b style={{ color: "var(--hr-fg-1)", fontWeight: 600 }}>Telegram</b>
        </>
      ),
    },
    {
      when: "1 мин",
      act: (
        <>
          Записал заявку в{" "}
          <b style={{ color: "var(--hr-fg-1)", fontWeight: 600 }}>CRM</b>
        </>
      ),
    },
    {
      when: "3 мин",
      act: (
        <>
          Передал сложный вопрос{" "}
          <b style={{ color: "var(--hr-fg-1)", fontWeight: 600 }}>менеджеру</b>
        </>
      ),
    },
  ];
  return (
    <Win live>
      <div style={{ padding: "4px 14px 12px" }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 13,
              alignItems: "baseline",
              padding: "10px 0",
              borderBottom:
                i < lines.length - 1 ? "1px solid var(--hr-border-1)" : "none",
            }}
          >
            <span
              style={{ fontSize: 12, color: "var(--hr-fg-4)", whiteSpace: "nowrap" }}
            >
              {l.when}
            </span>
            <span style={{ fontSize: 13.5, color: "var(--hr-fg-2)", lineHeight: 1.4 }}>
              {l.act}
            </span>
          </div>
        ))}
      </div>
    </Win>
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
        Загружаете продукт, назначаете цену, продаёте напрямую.{" "}
        <span style={{ color: "var(--hr-fg-1)" }}>0% комиссии.</span> Каталог,
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
              май 2026
            </div>
          </div>
          <div
            style={{
              ...monoStyle,
              fontSize: 10.5,
              color: "var(--hr-teal)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              background: "var(--hr-teal-soft)",
              borderRadius: 999,
            }}
          >
            +24% к июню
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
          <Stat value="1 раз" label="публикация" />
          <Stat value="24/7" label="каталог продаёт" />
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
