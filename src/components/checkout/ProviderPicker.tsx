"use client";

type ProviderName = "yookassa" | "nowpayments";

type Props = {
  providers: ProviderName[];
  value: ProviderName | null;
  onChange: (v: ProviderName) => void;
};

const providerMeta: Record<ProviderName, { label: string; description: string; hint?: string }> = {
  yookassa: {
    label: "ЮKassa",
    description: "Карта · СБП · Apple Pay · Google Pay",
  },
  nowpayments: {
    label: "Криптовалюта",
    description: "USDT, USDC, BTC и др.",
    // Минимум NowPayments invoice: USDT TRC20 / USDC SOL начинаются примерно
    // $1-2, BTC сильно дороже. При price ниже этих порогов API вернёт
    // MIN_AMOUNT_ERROR — friendly-текст обрабатывается в nowpayments.ts.
    hint: "Минимум платежа ~ $2 / 200₽",
  },
};

export function ProviderPicker({ providers, value, onChange }: Props) {
  if (providers.length === 0 || providers.length === 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      {providers.map((provider) => {
        const meta = providerMeta[provider];
        const active = value === provider;

        return (
          <button
            key={provider}
            type="button"
            onClick={() => onChange(provider)}
            className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-colors ${
              active
                ? "border-foreground/20 bg-secondary"
                : "border-border/40 hover:border-border"
            }`}
          >
            <div>
              <div className="text-[15px] font-semibold">{meta.label}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{meta.description}</div>
              {meta.hint && (
                <div className="mt-1 text-[10.5px] text-muted-foreground/70">{meta.hint}</div>
              )}
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                active
                  ? "border-foreground bg-foreground"
                  : "border-border"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
