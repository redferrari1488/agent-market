import {
  MessageSquare,
  PenTool,
  BarChart3,
  Activity,
  ShoppingCart,
  Users,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

// Иконка категории (lucide). Единый источник для карточек каталога —
// AgentCard и AgentCardLegacy — чтобы у КАЖДОЙ карточки была иконка, даже
// если для агента нет кастомной AgentIcon. Категории совпадают с
// CATEGORY_LABELS в @/lib/category-color (support/content/analytics/
// monitoring/sales/hr).
const CATEGORY_ICONS: Record<string, ComponentType<LucideProps>> = {
  support: MessageSquare,
  content: PenTool,
  analytics: BarChart3,
  monitoring: Activity,
  sales: ShoppingCart,
  hr: Users,
};

// Module-scope компонент (не фабрика-через-вызов в рендере — иначе
// react-hooks/static-components). Иконка выбирается индекс-доступом.
export function CategoryIcon({
  category,
  ...props
}: { category: string | null | undefined } & LucideProps) {
  const key = category && category in CATEGORY_ICONS ? category : "support";
  const Icon = CATEGORY_ICONS[key];
  return <Icon {...props} />;
}
