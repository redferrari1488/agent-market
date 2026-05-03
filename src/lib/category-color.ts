// Per-category accent colors for the catalog cards. Single chroma/lightness
// across the palette; only hue rotates so the grid stays calm.

export const CATEGORY_LABELS: Record<string, string> = {
  support: "Поддержка",
  content: "Контент",
  analytics: "Аналитика",
  monitoring: "Мониторинг",
  sales: "Продажи",
  hr: "HR",
};

export const CATEGORY_COLORS: Record<string, string> = {
  support: "oklch(0.72 0.16 160)",
  content: "oklch(0.7 0.16 280)",
  analytics: "oklch(0.7 0.16 240)",
  monitoring: "oklch(0.74 0.16 50)",
  sales: "oklch(0.72 0.17 20)",
  hr: "oklch(0.7 0.16 320)",
};

export const ACCENT_CYAN = "oklch(0.74 0.18 200)";

export function categoryColor(key: string | null | undefined): string {
  if (!key) return ACCENT_CYAN;
  return CATEGORY_COLORS[key] || ACCENT_CYAN;
}

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return "агент";
  return CATEGORY_LABELS[key] || key;
}
