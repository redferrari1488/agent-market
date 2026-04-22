import type { PaymentCurrency } from "@/lib/payments/provider";

export type MoneyByCurrency = Partial<Record<PaymentCurrency, number>>;

export function normalizePaymentCurrency(
  currency: string | null | undefined,
): PaymentCurrency {
  return currency === "USD" ? "USD" : "RUB";
}

export function formatMinorAmount(
  amountMinor: number,
  currency: string | null | undefined,
  locale?: string,
): string {
  const normalizedCurrency = normalizePaymentCurrency(currency);
  const hasFraction = Math.abs(amountMinor % 100) > 0;

  return new Intl.NumberFormat(locale ?? "ru-RU", {
    style: "currency",
    currency: normalizedCurrency,
    currencyDisplay: normalizedCurrency === "USD" ? "narrowSymbol" : "symbol",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function addMoney(
  summary: MoneyByCurrency,
  currency: string | null | undefined,
  amountMinor: number,
): MoneyByCurrency {
  const normalizedCurrency = normalizePaymentCurrency(currency);
  return {
    ...summary,
    [normalizedCurrency]: (summary[normalizedCurrency] ?? 0) + amountMinor,
  };
}

export function formatMoneySummary(summary: MoneyByCurrency): string {
  const ordered: PaymentCurrency[] = ["RUB", "USD"];

  return ordered
    .filter((currency) => (summary[currency] ?? 0) > 0)
    .map((currency) => formatMinorAmount(summary[currency] ?? 0, currency))
    .join(" · ");
}
