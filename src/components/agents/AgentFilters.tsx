"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4">
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
          className="pl-9"
        />
      </div>

      {/* Категории */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={currentCategory === cat.value ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              currentCategory === cat.value
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "hover:border-violet-600/50 hover:text-violet-500"
            }`}
            onClick={() => updateParams("category", cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* Сортировка */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams("sort", opt.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                currentSort === opt.value
                  ? "bg-violet-600/10 text-violet-500"
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
