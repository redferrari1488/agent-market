import { COMPUTE_CLASSES, DEFAULT_COMPUTE_CLASS, type ComputeClass } from "@/lib/compute";
import type { AgentRow, PaymentCurrency, ProviderName, PurchaseType } from "./provider";

export type ResolvedCheckoutPricing = {
  currency: PaymentCurrency;
  sellerPriceMinor: number;
  computePriceMinor: number;
  totalMinor: number;
};

function getComputeClass(agent: AgentRow): ComputeClass {
  return agent.computeClass && agent.computeClass in COMPUTE_CLASSES
    ? (agent.computeClass as ComputeClass)
    : DEFAULT_COMPUTE_CLASS;
}

function getSellerPriceRubMinor(agent: AgentRow, purchaseType: PurchaseType): number | null {
  return purchaseType === "subscription" ? agent.priceMonthly : agent.priceOnetime;
}

function getSellerPriceUsdMinor(agent: AgentRow, purchaseType: PurchaseType): number | null {
  return purchaseType === "subscription" ? agent.priceMonthlyUsd : agent.priceOnetimeUsd;
}

function deriveComputeUsdMinor(
  computeRubMinor: number,
  sellerRubMinor: number,
  sellerUsdMinor: number,
): number {
  // Используем implied FX из пары цен самого агента (RUB <-> USD),
  // чтобы не зависеть от внешнего курсового сервиса и не вводить
  // отдельную USD-таблицу compute-классов.
  return Math.round((computeRubMinor * sellerUsdMinor) / sellerRubMinor);
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

  const computePriceRubMinor = COMPUTE_CLASSES[getComputeClass(agent)].priceKopecks;

  if (provider === "nowpayments") {
    const sellerPriceUsdMinor = getSellerPriceUsdMinor(agent, purchaseType);
    if (sellerPriceUsdMinor != null && sellerPriceUsdMinor > 0) {
      const computePriceUsdMinor = deriveComputeUsdMinor(
        computePriceRubMinor,
        sellerPriceRubMinor,
        sellerPriceUsdMinor,
      );

      return {
        currency: "USD",
        sellerPriceMinor: sellerPriceUsdMinor,
        computePriceMinor: computePriceUsdMinor,
        totalMinor: sellerPriceUsdMinor + computePriceUsdMinor,
      };
    }
  }

  return {
    currency: "RUB",
    sellerPriceMinor: sellerPriceRubMinor,
    computePriceMinor: computePriceRubMinor,
    totalMinor: sellerPriceRubMinor + computePriceRubMinor,
  };
}
