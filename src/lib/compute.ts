// Классы вычислительных ресурсов для агентов.
// Лимиты — Docker HostConfig (CPU/Memory/Disk). Это инженерный контракт ресурсов
// контейнера, НЕ цена для покупателя.
//
// priceKopecks — справочная стоимость хостинга класса (для P&L аналитики
// и будущей бизнес-модели). В Phase 0 покупатель платит ровно price_monthly
// агента; compute в платёж не добавляется. Когда вернутся сторонние продавцы —
// платформа будет удерживать комиссию % с gross, хостинг покрывается из неё.

export type ComputeClass = "XS" | "S" | "M" | "L";

export const COMPUTE_CLASSES = {
  XS: {
    label: "XS — E2E",
    description: "Внутренний тариф для E2E-тестов и микро-агентов",
    priceKopecks: 1_000, // 10₽
    cpu: 0.1,
    memoryMb: 128,
    diskGb: 0,
    hasCron: false,
    specs: "Минимальные ресурсы",
  },
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

// Комиссия платформы — 0% в Phase 0 (бесплатное размещение). Когда сторонние
// продавцы вернутся — поле станет переменным (per-seller или global config),
// и платформа будет удерживать % от gross_price. Хостинг (compute) покрывается
// из этой комиссии, а не отдельной строкой для покупателя.
export const PLATFORM_COMMISSION = 0;
export const SELLER_SHARE = 1;

/** Доля продавца от его части цены (копейки). 100% при текущей модели. */
export function sellerPayout(sellerPriceKopecks: number): number {
  return sellerPriceKopecks;
}

/** Комиссия платформы с части продавца (копейки). 0 при текущей модели. */
export function platformCommission(sellerPriceKopecks: number): number {
  void sellerPriceKopecks;
  return 0;
}
