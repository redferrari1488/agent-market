// Классы вычислительных ресурсов для агентов.
// Цены в копейках (RUB). Лимиты — Docker HostConfig.
//
// Модель ценообразования (B+C):
//   price_monthly агента = цена труда продавца
//   покупатель платит: price_monthly + COMPUTE_CLASSES[class].priceKopecks
//   комиссия 12% только с price_monthly; хостинг — passthrough платформы

export type ComputeClass = "S" | "M" | "L";

export const COMPUTE_CLASSES = {
  S: {
    label: "S — Базовый",
    description: "Для простых агентов: чат-боты, уведомления, лёгкие задачи",
    priceKopecks: 39_000, // 390₽/мес
    cpu: 0.25,            // CpuShares = 256 (0.25 * 1024)
    memoryMb: 256,
    diskGb: 0,
    hasCron: false,
    specs: "Базовые ресурсы",
  },
  M: {
    label: "M — Стандарт",
    description: "Для агентов с хранением данных: контент, аналитика, мониторинг",
    priceKopecks: 79_000, // 790₽/мес
    cpu: 0.5,
    memoryMb: 512,
    diskGb: 1,
    hasCron: false,
    specs: "Расширенные ресурсы · хранилище",
  },
  L: {
    label: "L — Продвинутый",
    description: "Для масштабных задач: много данных, высокая нагрузка, расписание",
    priceKopecks: 169_000, // 1690₽/мес
    cpu: 1,
    memoryMb: 1024,
    diskGb: 5,
    hasCron: true,
    specs: "Максимальные ресурсы · хранилище · расписание",
  },
} as const satisfies Record<ComputeClass, {
  label: string;
  description: string;
  priceKopecks: number;
  cpu: number;
  memoryMb: number;
  diskGb: number;
  hasCron: boolean;
  specs: string;
}>;

export const DEFAULT_COMPUTE_CLASS: ComputeClass = "S";

// Комиссия платформы — только с части продавца.
export const PLATFORM_COMMISSION = 0.12; // 12%
export const SELLER_SHARE = 0.88;        // 88%

/** Общая цена для покупателя (копейки). */
export function totalPrice(sellerPriceKopecks: number, computeClass: ComputeClass): number {
  return sellerPriceKopecks + COMPUTE_CLASSES[computeClass].priceKopecks;
}

/** Доля продавца от его части цены (копейки). */
export function sellerPayout(sellerPriceKopecks: number): number {
  return Math.floor(sellerPriceKopecks * SELLER_SHARE);
}

/** Комиссия платформы с части продавца (копейки). */
export function platformCommission(sellerPriceKopecks: number): number {
  return sellerPriceKopecks - sellerPayout(sellerPriceKopecks);
}
