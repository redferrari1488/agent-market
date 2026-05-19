"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatChip, monoStyle, onestStyle } from "@/components/landing/redesign/shared";
import { CATEGORY_LABELS } from "@/lib/category-color";
import { scoreAgent } from "@/lib/agent-scoring";
import { safeExternalHref } from "@/lib/safe-url";
import type { Agent } from "./AgentCard";

// Catalog A (Refined list) — портирован из Claude Design mobile-designs.html
// (catalogs.jsx → CatalogV1). Vertical full-width карточки с category-edge,
// h-scroll category pills, плавающая кнопка «фильтры · сортировка» внизу.
// Рендерится только на мобиле (≤880px) — десктоп использует AgentCatalogClient.

type Sort = "popular" | "price_asc" | "price_desc" | "newest";

const SORT_LABELS: { id: Sort; label: string }[] = [
  { id: "popular", label: "популярность" },
  { id: "price_asc", label: "цена ↑" },
  { id: "price_desc", label: "цена ↓" },
  { id: "newest", label: "новые" },
];

const CAT_COLOR: Record<string, string> = {
  support: "var(--hr-cat-support)",
  content: "var(--hr-cat-content)",
  monitoring: "var(--hr-cat-monitoring)",
  sales: "var(--hr-cat-sales)",
  analytics: "var(--hr-cat-analytics)",
};

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

function formatPrice(minor: number | null | undefined): string {
  if (!minor || minor <= 0) return "—";
  return `${Math.floor(minor / 100).toLocaleString("ru-RU")} ₽`;
}

export function AgentCatalogMobile({ agents }: { agents: Agent[] }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [sort, setSort] = useState<Sort>("popular");
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleCategories = useMemo(() => {
    const used = new Set(agents.map((a) => a.category).filter(Boolean) as string[]);
    return Object.keys(CATEGORY_LABELS).filter((c) => used.has(c));
  }, [agents]);

  const filtered = useMemo(() => {
    let list = [...agents];
    if (activeCat) list = list.filter((a) => a.category === activeCat);
    if (search.trim()) {
      list = list
        .map((a) => ({ a, score: scoreAgent(a, search) }))
        .filter(({ score }) => score > 0)
        .sort((x, y) => y.score - x.score)
        .map(({ a }) => a);
    } else if (sort === "price_asc") {
      list.sort(
        (a, b) =>
          (a.price_monthly ?? Number.MAX_SAFE_INTEGER) -
          (b.price_monthly ?? Number.MAX_SAFE_INTEGER),
      );
    } else if (sort === "price_desc") {
      list.sort((a, b) => (b.price_monthly ?? -1) - (a.price_monthly ?? -1));
    } else if (sort === "newest") {
      // already ordered by createdAt desc upstream
    } else {
      list.sort((a, b) => b.purchases_count - a.purchases_count);
    }
    return list;
  }, [agents, activeCat, search, sort]);

  return (
    <div
      className="hr-mobile-only"
      style={{ ...onestStyle, background: "var(--hr-bg-base)", paddingBottom: 96 }}
    >
      {/* Title block */}
      <div style={{ padding: "22px 18px 14px" }}>
        <div
          style={{
            ...monoStyle,
            fontSize: 9.5,
            color: "var(--hr-fg-4)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          hireon / agents
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: "8px 0 0",
            color: "var(--hr-fg-1)",
          }}
        >
          AI-агенты <span style={{ color: "var(--hr-teal)" }}>для бизнеса</span>
        </h1>
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-3)",
            letterSpacing: "0.1em",
            marginTop: 10,
          }}
        >
          {filtered.length} {pluralize(filtered.length, ["агент", "агента", "агентов"])}
          {activeCat ? ` · ${(CATEGORY_LABELS[activeCat] || activeCat).toLowerCase()}` : ""}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 18px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--hr-bg-elev)",
            border: "1px solid var(--hr-border-1)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--hr-fg-3)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="опишите задачу…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--hr-fg-1)",
              fontSize: 16,
              letterSpacing: "-0.01em",
              minWidth: 0,
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                ...monoStyle,
                background: "transparent",
                border: "none",
                color: "var(--hr-fg-4)",
                fontSize: 14,
                cursor: "pointer",
                padding: 0,
              }}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      {visibleCategories.length > 0 && (
        <div
          className="hr-phone-scroll"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "0 18px 16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <CatPill label="все" active={!activeCat} onClick={() => setActiveCat("")} />
          {visibleCategories.map((k) => (
            <CatPill
              key={k}
              label={(CATEGORY_LABELS[k] || k).toLowerCase()}
              color={CAT_COLOR[k]}
              active={activeCat === k}
              onClick={() => setActiveCat(k)}
            />
          ))}
        </div>
      )}

      {/* Cards */}
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((a) => (
          <ListCard key={a.id} a={a} />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              border: "1px dashed var(--hr-border-2)",
              borderRadius: 12,
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--hr-fg-3)",
              fontSize: 13,
            }}
          >
            Под запрос ничего не нашли — попробуй другую формулировку.
          </div>
        )}
      </div>

      {/* Floating filter button */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 30,
        }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            pointerEvents: "auto",
            background: "var(--hr-bg-elev-3)",
            color: "var(--hr-fg-1)",
            border: "1px solid var(--hr-border-2)",
            padding: "12px 20px",
            borderRadius: 999,
            fontWeight: 500,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            cursor: "pointer",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 6h18M6 12h12M10 18h4" />
          </svg>
          фильтры · сортировка
        </button>
      </div>

      {/* Bottom sheet — sort */}
      {sheetOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={() => setSheetOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
            }}
            aria-hidden
          />
          <div
            style={{
              position: "relative",
              background: "var(--hr-bg-elev)",
              borderTop: "1px solid var(--hr-border-2)",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: "18px 20px 28px",
              boxShadow: "0 -20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--hr-border-3)",
                margin: "0 auto 16px",
              }}
              aria-hidden
            />
            <div
              style={{
                ...monoStyle,
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--hr-fg-3)",
                marginBottom: 12,
              }}
            >
              сортировка
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SORT_LABELS.map((s) => {
                const active = sort === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSort(s.id);
                      setSheetOpen(false);
                    }}
                    style={{
                      background: active ? "var(--hr-bg-elev-2)" : "transparent",
                      color: active ? "var(--hr-teal)" : "var(--hr-fg-1)",
                      border: "none",
                      padding: "14px 12px",
                      borderRadius: 10,
                      textAlign: "left",
                      fontSize: 15,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{s.label}</span>
                    {active && (
                      <span
                        style={{ ...monoStyle, fontSize: 11, color: "var(--hr-teal)" }}
                      >
                        выбрано
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CatPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...monoStyle,
        flexShrink: 0,
        padding: "7px 13px",
        fontSize: 10.5,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: 999,
        cursor: "pointer",
        background: active ? "var(--hr-bg-elev-3)" : "transparent",
        color: active ? color || "var(--hr-fg-1)" : "var(--hr-fg-3)",
        border: `1px solid ${active ? color || "var(--hr-border-2)" : "var(--hr-border-1)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function ListCard({ a }: { a: Agent }) {
  const c = CAT_COLOR[a.category ?? ""] || "var(--hr-fg-3)";
  const catLabel = (CATEGORY_LABELS[a.category ?? ""] || "агент").toLowerCase();
  const externalSafe = a.is_external ? safeExternalHref(a.external_url) : null;
  const href = externalSafe ?? `/agents/${a.slug}`;
  const external = a.is_external && Boolean(externalSafe);

  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{
        display: "flex",
        textDecoration: "none",
        color: "inherit",
        background: "var(--hr-bg-elev)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ width: 3, background: c, flexShrink: 0 }} />
      <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <CatChip color={c}>{catLabel}</CatChip>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--hr-fg-1)",
            lineHeight: 1.2,
          }}
        >
          {a.name}
        </div>
        {a.description && (
          <p
            style={{
              fontSize: 12.5,
              color: "var(--hr-fg-2)",
              lineHeight: 1.45,
              margin: "5px 0 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {a.description}
          </p>
        )}
        <div
          style={{
            marginTop: 11,
            paddingTop: 11,
            borderTop: "1px solid var(--hr-border-1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: "var(--hr-fg-1)",
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {external ? "у продавца" : formatPrice(a.price_monthly)}
            </span>
            {!external && a.price_monthly && a.price_monthly > 0 && (
              <span
                style={{
                  ...monoStyle,
                  fontSize: 9,
                  color: "var(--hr-fg-4)",
                  fontWeight: 500,
                  marginLeft: 5,
                  letterSpacing: "0.06em",
                }}
              >
                /мес
              </span>
            )}
          </div>
          <span
            style={{
              ...monoStyle,
              fontSize: 10,
              color: "var(--hr-teal)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {external ? "перейти →" : "нанять →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
