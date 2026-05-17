import type { AgentRow, PaymentCurrency, ProviderName, PurchaseType } from "./provider";

// Phase 0: покупатель платит ровно цену агента (seller_price). Compute (хостинг)
// в платёж не добавляется — покрывается фиксированными VPS-расходами платформы.
// USD-цена опциональна: если задана priceMonthlyUsd / priceOnetimeUsd и провайдер
// NowPayments — checkout идёт в USD, иначе RUB.

export type ResolvedCheckoutPricing = {
  currency: PaymentCurrency;
  sellerPriceMinor: number;
  totalMinor: number;
};

function getSellerPriceRubMinor(agent: AgentRow, purchaseType: PurchaseType): number | null {
  return purchaseType === "subscription" ? agent.priceMonthly : agent.priceOnetime;
}

function getSellerPriceUsdMinor(agent: AgentRow, purchaseType: PurchaseType): number | null {
  return purchaseType === "subscription" ? agent.priceMonthlyUsd : agent.priceOnetimeUsd;
}

export function resolveCheckoutPricing(
  agent: AgentRow,
  purchaseType: PurchaseType,
  provider?: ProviderName,
): ResolvedCheckoutPricing {
  const sellerPriceRubMinor = getSellerPriceRubMinor(agent, purchaseType);
  if (sellerPriceRubMinor == null || sellerPriceRubMinor <= 0) {
    throw new Error("Seller price is not configured for checkout");
  }

  if (provider === "nowpayments") {
    const sellerPriceUsdMinor = getSellerPriceUsdMinor(agent, purchaseType);
    if (sellerPriceUsdMinor != null && sellerPriceUsdMinor > 0) {
      return {
        currency: "USD",
        sellerPriceMinor: sellerPriceUsdMinor,
        totalMinor: sellerPriceUsdMinor,
      };
    }
  }

  return {
    currency: "RUB",
    sellerPriceMinor: sellerPriceRubMinor,
    totalMinor: sellerPriceRubMinor,
  };
}
