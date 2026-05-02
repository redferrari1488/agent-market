"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type CatalogTab = "all" | "hireon" | "lock_in" | "external";

type Counts = Record<CatalogTab, number>;

const tabConfig: { value: CatalogTab; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "hireon", label: "hireon" },
  { value: "lock_in", label: "lock-in" },
  { value: "external", label: "От продавцов" },
];

export function CatalogTabs({
  activeTab,
  counts,
}: {
  activeTab: CatalogTab;
  counts: Counts;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Скрываем брендовые/внешние вкладки, пока в группе нет агентов.
  // "Все" + "hireon" показываем всегда, чтобы на пустой Lock-in-коллабе UI
  // не превращался в один tab.
  const visibleTabs = tabConfig.filter((t) => {
    if (t.value === "all" || t.value === "hireon") return true;
    return counts[t.value] > 0;
  });

  if (visibleTabs.length <= 1) return null;

  const onClick = (tab: CatalogTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.push(`/agents?${params.toString()}`);
  };

  return (
    <div className="mb-6 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-0 border-b border-border/40 sm:w-auto">
        {visibleTabs.map((t) => {
          const active = activeTab === t.value;
          const count = counts[t.value];
          return (
            <button
              key={t.value}
              onClick={() => onClick(t.value)}
              className={`relative inline-flex h-10 shrink-0 items-center gap-1.5 px-4 font-mono text-[12px] tracking-[0.03em] transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`font-mono text-[10px] tabular-nums ${
                  active ? "text-muted-foreground" : "text-muted-foreground/40"
                }`}
              >
                {count}
              </span>
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
