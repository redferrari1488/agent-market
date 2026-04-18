"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProviderPicker } from "@/components/checkout/ProviderPicker";

type ProviderName = "yookassa" | "cryptomus";

type Props = {
  agentId: string;
  pricingModel: "subscription" | "one_time" | "both";
  priceMonthly: number | null;
  priceOnetime: number | null;
  isLoggedIn: boolean;
};

export function PurchaseButton({
  agentId,
  pricingModel,
  priceMonthly,
  priceOnetime,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<"subscription" | "one_time">(
    pricingModel === "one_time" ? "one_time" : "subscription"
  );
  const [providers, setProviders] = useState<ProviderName[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderName | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProviders = async () => {
      try {
        const res = await fetch("/api/payments/providers");
        if (!res.ok) {
          throw new Error("providers fetch failed");
        }

        const json = await res.json();
        if (!cancelled) {
          setProviders(Array.isArray(json.providers) ? json.providers : []);
        }
      } catch {
        if (!cancelled) {
          setProviders([]);
        }
      } finally {
        if (!cancelled) {
          setProvidersLoading(false);
        }
      }
    };

    void loadProviders();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (providers.length === 1) {
      setSelectedProvider(providers[0]);
      return;
    }

    setSelectedProvider((current) =>
      current && providers.includes(current) ? current : null
    );
  }, [providers]);

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?returnTo=/agents`);
      return;
    }
    if (providersLoading || (providers.length > 1 && !selectedProvider)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          purchaseType: selected,
          provider: selectedProvider ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось оформить");
        setLoading(false);
        return;
      }

      if (json.data.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
        return;
      }

      router.push(`/dashboard/agents/${json.data.subscriptionId}`);
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  };

  const monthlyPrice =
    priceMonthly != null ? (priceMonthly / 100).toFixed(0) : null;
  const onetimePrice =
    priceOnetime != null ? (priceOnetime / 100).toFixed(0) : null;

  return (
    <div>
      {pricingModel === "both" ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelected("subscription")}
            className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-colors ${
              selected === "subscription"
                ? "border-foreground/20 bg-secondary"
                : "border-border/40 hover:border-border"
            }`}
          >
            <div>
              <div className="text-[11px] text-muted-foreground">Подписка</div>
              <div className="text-[15px] font-semibold">{monthlyPrice} ₽/мес</div>
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                selected === "subscription"
                  ? "border-foreground bg-foreground"
                  : "border-border"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setSelected("one_time")}
            className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-colors ${
              selected === "one_time"
                ? "border-foreground/20 bg-secondary"
                : "border-border/40 hover:border-border"
            }`}
          >
            <div>
              <div className="text-[11px] text-muted-foreground">Разово</div>
              <div className="text-[15px] font-semibold">{onetimePrice} ₽</div>
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                selected === "one_time"
                  ? "border-foreground bg-foreground"
                  : "border-border"
              }`}
            />
          </button>
        </div>
      ) : pricingModel === "subscription" ? (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Подписка
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[2rem] font-bold tracking-[-0.03em]">
              {monthlyPrice} ₽
            </span>
            <span className="text-[13px] text-muted-foreground">/мес</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Разовая покупка
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[2rem] font-bold tracking-[-0.03em]">
              {onetimePrice} ₽
            </span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <ProviderPicker
          providers={providers}
          value={selectedProvider}
          onChange={setSelectedProvider}
        />
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || providersLoading || (providers.length > 1 && !selectedProvider)}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-foreground text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading || providersLoading ? "Создаём..." : "Подключить"}
      </button>
      {error && (
        <p className="mt-2 text-center text-[11px] text-red-400">{error}</p>
      )}
      {providers.length === 0 && !providersLoading && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Платежи в разработке - подключение без оплаты
        </p>
      )}
    </div>
  );
}
