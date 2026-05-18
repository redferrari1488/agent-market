"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentSplash } from "./AgentSplash";
import { AgentGrid } from "./AgentGrid";
import { AgentCatalogMobile } from "./AgentCatalogMobile";
import { CATEGORY_LABELS } from "@/lib/category-color";
import { scoreAgent } from "@/lib/agent-scoring";
import type { Agent } from "./AgentCard";

type Tab = "all" | "hireon" | "lock_in" | "external";
type Sort = "relevance" | "popular" | "rating" | "price_asc" | "price_desc" | "newest";

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: "all", label: "все" },
  { id: "hireon", label: "hireon" },
  { id: "lock_in", label: "lock-in" },
  { id: "external", label: "от продавцов" },
];

const SORT_LABELS: { id: Sort; label: string }[] = [
  { id: "relevance", label: "релевантность" },
  { id: "popular", label: "популярность" },
  { id: "rating", label: "рейтинг" },
  { id: "price_asc", label: "цена ↑" },
  { id: "price_desc", label: "цена ↓" },
  { id: "newest", label: "новые" },
];

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

export function AgentCatalogClient({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const initialQ = params.get("q") || "";
  const initialTab = (params.get("tab") as Tab) || "all";
  const initialCat = params.get("category") || "";

  // Splash ("опишите задачу") больше не блокирует первый экран — каталог
  // показывается сразу. Открыть splash можно кнопкой «новый запрос» в шапке.
  const [showSplash, setShowSplash] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [activeCat, setActiveCat] = useState<string>(initialCat);
  const [search, setSearch] = useState<string>(initialQ);
  const [sort, setSort] = useState<Sort>(initialQ ? "relevance" : "popular");
  const [visible, setVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!showSplash) {
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [showSplash]);

  // ?focus=search → автофокус на инпут поиска после захода из Header'а.
  // На мобильных также не вызываем .focus() автоматически, чтобы не дёргать
  // клавиатуру: проверяем pointer.
  useEffect(() => {
    if (params.get("focus") !== "search" || showSplash) return;
    const el = searchInputRef.current;
    if (!el) return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (!isCoarse) el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [params, showSplash]);

  const handleSplashSubmit = (q: string) => {
    setSearch(q);
    setSort(q ? "relevance" : "popular");
    setShowSplash(false);
    const next = q ? `/agents?q=${encodeURIComponent(q)}` : "/agents";
    router.replace(next, { scroll: false });
  };

  const handleSplashBrowse = () => {
    setShowSplash(false);
    router.replace("/agents", { scroll: false });
  };

  const goSplash = () => {
    setShowSplash(true);
    setSearch("");
    setSort("popular");
    setActiveCat("");
    setActiveTab("all");
    router.replace("/agents", { scroll: false });
  };

  const counts = useMemo(() => {
    const all = agents.length;
    const hireon = agents.filter((a) => !a.is_external && a.brand === "hireon").length;
    const lock_in = agents.filter((a) => !a.is_external && a.brand === "lock_in").length;
    const external = agents.filter((a) => a.is_external).length;
    return { all, hireon, lock_in, external };
  }, [agents]);

  const visibleTabs = useMemo(
    () => TAB_LABELS.filter((t) => t.id === "all" || counts[t.id] > 0),
    [counts]
  );

  const visibleCategories = useMemo(() => {
    const used = new Set(agents.map((a) => a.category).filter(Boolean) as string[]);
    return CATEGORY_KEYS.filter((c) => used.has(c));
  }, [agents]);

  const scored = useMemo(() => {
    if (!search.trim()) return agents.map((a) => ({ ...a, _score: 0 }));
    return agents.map((a) => ({ ...a, _score: scoreAgent(a, search) }));
  }, [agents, search]);

  const filtered = useMemo(() => {
    let list = [...scored];

    if (activeTab === "hireon") list = list.filter((a) => !a.is_external && a.brand === "hireon");
    else if (activeTab === "lock_in")
      list = list.filter((a) => !a.is_external && a.brand === "lock_in");
    else if (activeTab === "external") list = list.filter((a) => a.is_external);

    if (activeCat) list = list.filter((a) => a.category === activeCat);

    if (sort === "relevance" && search.trim()) {
      list.sort((a, b) => (b._score || 0) - (a._score || 0));
      const withMatches = list.filter((a) => (a._score || 0) > 0);
      const rest = list.filter((a) => (a._score || 0) === 0);
      list = [...withMatches, ...rest];
    } else if (sort === "rating") {
      list.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    } else if (sort === "price_asc") {
      list.sort((a, b) => (a.price_monthly ?? Number.MAX_SAFE_INTEGER) - (b.price_monthly ?? Number.MAX_SAFE_INTEGER));
    } else if (sort === "price_desc") {
      list.sort((a, b) => (b.price_monthly ?? -1) - (a.price_monthly ?? -1));
    } else if (sort === "newest") {
      // server already orders by createdAt desc when fetching all
    } else {
      list.sort((a, b) => b.purchases_count - a.purchases_count);
    }
    return list;
  }, [scored, activeTab, activeCat, sort, search]);

  const hasQuery = search.trim().length > 0;
  const matches = hasQuery ? filtered.filter((a) => (a._score || 0) > 0) : [];
  const matchesCount = matches.length;

  if (showSplash) {
    return <AgentSplash onSubmit={handleSplashSubmit} onBrowse={handleSplashBrowse} />;
  }

  return (
    <>
      {/* Mobile (≤880px) — отдельный layout: vertical list + floating filter sheet.
          Передаём исходные agents (не filtered) — у mobile свой search/category/sort. */}
      <AgentCatalogMobile agents={agents} />

      {/* Desktop (≥881px) — оригинальный grid с tabs/sort/sticky filter bar. */}
      <div
        className="hr-desktop-only px-5 pb-20 sm:px-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(18px)",
          transition: "opacity .45s ease, transform .45s ease",
        }}
      >
        <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-6 sm:pt-10 sm:pb-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/55">
              hireon / agents
            </p>
            <h1 className="mt-2 text-[clamp(22px,3vw,36px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
              {hasQuery && matchesCount > 0 ? (
                <>
                  Нашли <span className="text-primary">{matchesCount}</span>{" "}
                  {pluralize(matchesCount, ["подходящего", "подходящих", "подходящих"])}
                </>
              ) : (
                <>
                  AI-агенты <span className="text-primary">для бизнеса</span>
                </>
              )}
            </h1>
          </div>
          <button
            type="button"
            onClick={goSplash}
            className="rounded-[2px] border border-border/60 bg-transparent px-3.5 py-2 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground/70 transition-colors hover:text-muted-foreground"
          >
            ← новый запрос
          </button>
        </div>

        {/* Active query bar */}
        {hasQuery && (
          <div className="mb-5 flex items-center gap-3 rounded-[2px] border border-border/40 bg-card/40 px-4 py-2.5">
            <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground/50 shrink-0">
              запрос:
            </span>
            <span className="flex-1 truncate text-[13px] text-foreground sm:text-[14px]">
              {search}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSort("popular");
                router.replace("/agents", { scroll: false });
              }}
              className="font-mono text-[10px] tracking-[0.04em] text-muted-foreground/50 transition-colors hover:text-foreground shrink-0"
            >
              сбросить ×
            </button>
          </div>
        )}

        {/* Filter bar (sticky on desktop) */}
        <div
          className="sticky z-30 -mx-5 mb-6 bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6"
          style={{ top: "calc(3.5rem + env(safe-area-inset-top))" }}
        >
          {/* Tabs */}
          {visibleTabs.length > 1 && (
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max items-center gap-0 border-b border-border/30 sm:w-auto">
                {visibleTabs.map((t) => {
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className="relative inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 font-mono text-[11px] tracking-[0.04em] transition-colors sm:px-4 sm:text-[12px]"
                      style={{ color: active ? "var(--primary)" : "color-mix(in oklch, var(--muted-foreground) 70%, transparent)" }}
                    >
                      {t.label}
                      <span
                        className="rounded-[2px] px-1 py-px font-mono text-[9px] sm:text-[10px]"
                        style={{
                          background: active
                            ? "color-mix(in oklch, var(--primary) 12%, transparent)"
                            : "rgba(255,255,255,0.04)",
                          color: active
                            ? "var(--primary)"
                            : "color-mix(in oklch, var(--muted-foreground) 40%, transparent)",
                        }}
                      >
                        {counts[t.id]}
                      </span>
                      {active && (
                        <span
                          className="absolute inset-x-0 -bottom-px h-[1px]"
                          style={{ background: "var(--primary)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 1: search + sort — стэк на узких экранах (≤400px) */}
          <div className="flex flex-col items-stretch gap-2 py-3 min-[400px]:flex-row min-[400px]:items-center">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.trim()) setSort("relevance");
              }}
              placeholder="поиск..."
              className="h-11 w-full rounded-[2px] border border-border/40 bg-card/40 px-3 font-mono text-[16px] outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-border min-[400px]:flex-1 sm:h-9 sm:max-w-[280px] sm:text-[12px]"
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-11 w-full shrink-0 rounded-[2px] border border-border/40 bg-card/40 px-2.5 font-mono text-[12px] text-muted-foreground/85 outline-none min-[400px]:w-auto sm:ml-auto sm:h-9 sm:text-[10.5px]"
            >
              {SORT_LABELS.filter((s) => s.id !== "relevance" || hasQuery).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2: categories — horizontal scroll on mobile */}
          {visibleCategories.length > 0 && (
            <div className="-mx-5 overflow-x-auto pb-3 sm:-mx-6 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max items-center gap-1.5 px-5 sm:w-auto sm:flex-wrap sm:px-6">
                <button
                  type="button"
                  onClick={() => setActiveCat("")}
                  className="shrink-0 rounded-[2px] border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.04em] transition-colors"
                  style={{
                    background:
                      activeCat === ""
                        ? "color-mix(in oklch, var(--primary) 12%, transparent)"
                        : "transparent",
                    color:
                      activeCat === ""
                        ? "var(--primary)"
                        : "color-mix(in oklch, var(--muted-foreground) 70%, transparent)",
                    borderColor:
                      activeCat === ""
                        ? "color-mix(in oklch, var(--primary) 35%, transparent)"
                        : "rgba(255,255,255,0.06)",
                  }}
                >
                  все
                </button>
                {visibleCategories.map((c) => {
                  const active = activeCat === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCat(c)}
                      className="shrink-0 rounded-[2px] border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.04em] transition-colors"
                      style={{
                        background: active
                          ? "color-mix(in oklch, var(--primary) 12%, transparent)"
                          : "transparent",
                        color: active
                          ? "var(--primary)"
                          : "color-mix(in oklch, var(--muted-foreground) 70%, transparent)",
                        borderColor: active
                          ? "color-mix(in oklch, var(--primary) 35%, transparent)"
                          : "rgba(255,255,255,0.06)",
                      }}
                    >
                      {(CATEGORY_LABELS[c] || c).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

          <AgentGrid agents={filtered} cols={4} emptyHref="/agents" />
        </div>
      </div>
    </>
  );
}
