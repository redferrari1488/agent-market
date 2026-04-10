"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = [
  { value: "", label: "Все" },
  { value: "support", label: "Поддержка" },
  { value: "content", label: "Контент" },
  { value: "analytics", label: "Аналитика" },
  { value: "sales", label: "Продажи" },
  { value: "monitoring", label: "Мониторинг" },
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="relative space-y-4">
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Найти агента..."
            defaultValue={currentSearch}
            onChange={(e) => {
              const timeout = setTimeout(() => updateParams("q", e.target.value), 300);
              return () => clearTimeout(timeout);
            }}
            className="h-11 rounded-xl border-border/50 bg-white/5 pl-10 text-sm backdrop-blur-sm placeholder:text-muted-foreground focus-visible:border-violet-500/50 focus-visible:bg-white/[0.07] focus-visible:ring-0"
          />
        </div>

        {/* Категории + сортировка */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => updateParams("category", cat.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                currentCategory === cat.value
                  ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/25"
                  : "border border-border/50 bg-white/5 text-muted-foreground backdrop-blur-sm hover:border-violet-500/30 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}

          <div className="mx-1 h-4 w-px bg-border/50" />

          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams("sort", opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                currentSort === opt.value
                  ? "text-violet-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
