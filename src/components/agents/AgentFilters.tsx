"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import {
  Search,
  X,
  Layers,
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
  ArrowUpDown,
} from "lucide-react";

const categories = [
  { value: "", label: "Все", icon: Layers, accent: "text-foreground" },
  { value: "support", label: "Поддержка", icon: MessageSquare, accent: "text-blue-400" },
  { value: "content", label: "Контент", icon: PenTool, accent: "text-violet-400" },
  { value: "analytics", label: "Аналитика", icon: BarChart3, accent: "text-emerald-400" },
  { value: "sales", label: "Продажи", icon: ShoppingCart, accent: "text-amber-400" },
  { value: "monitoring", label: "Мониторинг", icon: Activity, accent: "text-cyan-400" },
];

const sortOptions = [
  { value: "popular", label: "Популярные" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
  { value: "rating", label: "По рейтингу" },
  { value: "newest", label: "Новые" },
];

export function AgentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "popular";
  const currentSearch = searchParams.get("q") || "";

  const [searchValue, setSearchValue] = useState(currentSearch);
  const [sortOpen, setSortOpen] = useState(false);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/agents?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (searchValue === currentSearch) return;
    const t = setTimeout(() => updateParams("q", searchValue), 300);
    return () => clearTimeout(t);
  }, [searchValue, currentSearch, updateParams]);

  const currentSortLabel = sortOptions.find((o) => o.value === currentSort)?.label || "Популярные";

  return (
    <div className="space-y-4">
      {/* Поиск + сортировка */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Найти агента..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-11 w-full rounded-lg border border-border/40 bg-background pl-10 pr-10 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-border"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Очистить"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border/40 px-3.5 text-[13px] transition-colors hover:border-border"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="hidden sm:inline">{currentSortLabel}</span>
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-border bg-background p-1 shadow-lg">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateParams("sort", opt.value);
                      setSortOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                      currentSort === opt.value
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                    {currentSort === opt.value && (
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Категории — chips с цветным акцентом */}
      <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
          {categories.map((cat) => {
            const active = currentCategory === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => updateParams("category", cat.value)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 text-[12.5px] font-medium transition-all ${
                  active
                    ? "border-foreground/20 bg-secondary text-foreground"
                    : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? cat.accent : "text-muted-foreground/60"}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
