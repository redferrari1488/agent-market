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
  accentColor?: string;
};

export function PurchaseButton({
  agentId,
  pricingModel,
  priceMonthly,
  priceOnetime,
  isLoggedIn,
  accentColor,
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
  const [termsAccepted, setTermsAccepted] = useState(false);

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
    if (!termsAccepted) {
      setError("Подтвердите согласие с офертой");
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
          termsAccepted: true,
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
            className="flex w-full items-center justify-between rounded-[2px] border p-3.5 text-left transition-colors"
            style={{
              borderColor:
                selected === "subscription"
                  ? accentColor
                    ? accentColor.replace(")", " / 0.4)")
                    : "color-mix(in oklch, var(--foreground) 20%, transparent)"
                  : "color-mix(in oklch, var(--border) 60%, transparent)",
              background:
                selected === "subscription"
                  ? accentColor
                    ? accentColor.replace(")", " / 0.06)")
                    : "var(--secondary)"
                  : "transparent",
            }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                Подписка
              </div>
              <div className="mt-0.5 font-mono text-[15px] font-medium">
                {monthlyPrice} ₽/мес
              </div>
            </div>
            <div
              className="h-3.5 w-3.5 rounded-full border-2"
              style={{
                borderColor:
                  selected === "subscription"
                    ? accentColor || "var(--foreground)"
                    : "var(--border)",
                background:
                  selected === "subscription"
                    ? accentColor || "var(--foreground)"
                    : "transparent",
              }}
            />
          </button>
          <button
            type="button"
            onClick={() => setSelected("one_time")}
            className="flex w-full items-center justify-between rounded-[2px] border p-3.5 text-left transition-colors"
            style={{
              borderColor:
                selected === "one_time"
                  ? accentColor
                    ? accentColor.replace(")", " / 0.4)")
                    : "color-mix(in oklch, var(--foreground) 20%, transparent)"
                  : "color-mix(in oklch, var(--border) 60%, transparent)",
              background:
                selected === "one_time"
                  ? accentColor
                    ? accentColor.replace(")", " / 0.06)")
                    : "var(--secondary)"
                  : "transparent",
            }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                Разово
              </div>
              <div className="mt-0.5 font-mono text-[15px] font-medium">
                {onetimePrice} ₽
              </div>
            </div>
            <div
              className="h-3.5 w-3.5 rounded-full border-2"
              style={{
                borderColor:
                  selected === "one_time"
                    ? accentColor || "var(--foreground)"
                    : "var(--border)",
                background:
                  selected === "one_time"
                    ? accentColor || "var(--foreground)"
                    : "transparent",
              }}
            />
          </button>
        </div>
      ) : pricingModel === "subscription" ? (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Подписка
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-[2rem] font-medium leading-none tracking-[-0.02em]">
              {monthlyPrice} ₽
            </span>
            <span className="font-mono text-[12px] text-muted-foreground/70">/мес</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Разовая покупка
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-[2rem] font-medium leading-none tracking-[-0.02em]">
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

      {isLoggedIn && (
        <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-snug text-muted-foreground">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (e.target.checked) setError(null);
            }}
            className="mt-[2px] h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-border bg-background accent-foreground"
          />
          <span>
            Согласен с{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2 hover:no-underline">
              офертой
            </a>
            {" "}и{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2 hover:no-underline">
              политикой&nbsp;конфиденциальности
            </a>
            .
          </span>
        </label>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || providersLoading || (providers.length > 1 && !selectedProvider) || (isLoggedIn && !termsAccepted)}
        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[2px] font-mono text-[12.5px] tracking-[0.06em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: accentColor || "var(--foreground)",
          color: accentColor ? "#0a0a09" : "var(--background)",
        }}
      >
        {loading || providersLoading ? "Создаём…" : "нанять →"}
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
