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
    <div className="space-y-3">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Найти агента..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const timeout = setTimeout(() => updateParams("q", e.target.value), 300);
            return () => clearTimeout(timeout);
          }}
          className="h-10 rounded-lg border-border bg-background pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>

      {/* Категории + сортировка */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => updateParams("category", cat.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              currentCategory === cat.value
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-border" />

        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParams("sort", opt.value)}
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              currentSort === opt.value
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
