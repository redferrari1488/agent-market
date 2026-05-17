"use client";

type ProviderName = "yookassa" | "nowpayments";
type Currency = "RUB" | "USD";

// Минимум NowPayments invoice. USDT TRC20 / USDC SOL начинаются примерно $1-2,
// BTC сильно дороже. Если price ниже этих порогов, NowPayments вернёт
// MIN_AMOUNT_ERROR на createCheckout — лучше не давать юзеру до этого дойти.
// Курс RUB→USD захардкожен с запасом (≈85₽/$), точный пересчёт делает
// провайдер; нам нужна только UX-граница.
const NOWPAYMENTS_MIN_USD_MINOR = 200; // $2.00 в центах
const NOWPAYMENTS_MIN_RUB_MINOR = 20000; // 200₽ в копейках ≈ $2

type Props = {
  providers: ProviderName[];
  value: ProviderName | null;
  onChange: (v: ProviderName) => void;
  // priceMinor + currency используются только для проверки минимума по
  // NowPayments. Если не переданы — подсказка/блокировка не показывается.
  priceMinor?: number | null;
  currency?: Currency;
};

const providerMeta: Record<ProviderName, { label: string; description: string }> = {
  yookassa: {
    label: "ЮKassa",
    description: "Карта · СБП · Apple Pay · Google Pay",
  },
  nowpayments: {
    label: "Криптовалюта",
    description: "USDT, USDC, BTC и др.",
  },
};

function nowpaymentsDisabledReason(
  priceMinor: number | null | undefined,
  currency: Currency | undefined,
): string | null {
  if (priceMinor == null || priceMinor <= 0) return null;
  if (currency === "USD") {
    if (priceMinor < NOWPAYMENTS_MIN_USD_MINOR) {
      return "Сумма ниже минимума криптосети (~$2). Оплатите через ЮКассу.";
    }
    return null;
  }
  // RUB по умолчанию
  if (priceMinor < NOWPAYMENTS_MIN_RUB_MINOR) {
    return "Сумма ниже минимума криптосети (~200₽). Оплатите через ЮКассу.";
  }
  return null;
}

export function ProviderPicker({
  providers,
  value,
  onChange,
  priceMinor,
  currency,
}: Props) {
  if (providers.length === 0 || providers.length === 1) {
    return null;
  }

  const cryptoDisabledReason = nowpaymentsDisabledReason(priceMinor, currency);

  return (
    <div className="space-y-2">
      {providers.map((provider) => {
        const meta = providerMeta[provider];
        const active = value === provider;
        const disabled = provider === "nowpayments" && cryptoDisabledReason !== null;

        const hint =
          provider === "nowpayments"
            ? cryptoDisabledReason ?? "Минимум платежа ~ $2 / 200₽"
            : null;

        return (
          <button
            key={provider}
            type="button"
            onClick={() => {
              if (disabled) return;
              onChange(provider);
            }}
            disabled={disabled}
            title={disabled ? cryptoDisabledReason ?? undefined : undefined}
            aria-disabled={disabled}
            className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-colors ${
              disabled
                ? "cursor-not-allowed border-border/30 opacity-50"
                : active
                  ? "border-foreground/20 bg-secondary"
                  : "border-border/40 hover:border-border"
            }`}
          >
            <div>
              <div className="text-[15px] font-semibold">{meta.label}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{meta.description}</div>
              {hint && (
                <div
                  className={`mt-1 text-[10.5px] ${
                    disabled ? "text-red-400/80" : "text-muted-foreground/70"
                  }`}
                >
                  {hint}
                </div>
              )}
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                active && !disabled
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
