// Фабрика провайдеров. Использование:
//   const provider = getProvider("yookassa");
//   if (provider) { ... } // null если env не сконфигурирован
//
// Главный принцип: если credentials YooKassa/NowPayments НЕ заданы в env —
// фабрика возвращает null, и API route падает обратно на dev-stub
// checkout (создание подписки без оплаты).
//
// Как только у нас появятся реальные ключи в .env на VPS — getProvider
// начнёт возвращать настоящую реализацию, и платежи заработают БЕЗ
// правок кода.

import { nowpaymentsProvider } from "./nowpayments";
import type { PaymentProvider, ProviderName } from "./provider";
import { providerEnvConfigured } from "./provider";
import { yookassaProvider } from "./yookassa";

export type { PaymentProvider, ProviderName, WebhookEvent } from "./provider";
export { providerEnvConfigured };

export function getProvider(name: ProviderName): PaymentProvider | null {
  if (!providerEnvConfigured(name)) return null;
  if (name === "yookassa") return yookassaProvider;
  if (name === "nowpayments") return nowpaymentsProvider;
  return null;
}

// Возвращает список провайдеров, у которых есть credentials — для ProviderPicker в UI.
export function listAvailableProviders(): ProviderName[] {
  const out: ProviderName[] = [];
  if (providerEnvConfigured("yookassa")) out.push("yookassa");
  if (providerEnvConfigured("nowpayments")) out.push("nowpayments");
  return out;
}
