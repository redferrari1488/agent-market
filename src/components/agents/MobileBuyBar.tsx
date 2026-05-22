// Sticky bottom bar для мобильного: цена + CTA на #buy.
// На десктопе скрыт через @media. Контент страницы получает
// padding-bottom через корневой .hr-mobile-pad чтобы не залезал под bar.

type Props = {
  price: string | null; // отформатированная цена ("2 500 ₽") либо null
  href: string; // обычно "#buy"
  ctaLabel: string; // "Подключить" / "Запросить доступ" / "Перейти к продавцу"
  accentColor: string;
  showPrice?: boolean; // false для seller / waitlist
};

export function MobileBuyBar({ price, href, ctaLabel, accentColor, showPrice = true }: Props) {
  return (
    <div className="hr-mobile-buybar">
      {showPrice && price && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span
            className="font-mono"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--hr-fg-4)",
            }}
          >
            подписка
          </span>
          <span
            style={{
              fontFamily: "var(--font-onest), 'Onest', sans-serif",
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--hr-fg-1)",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {price}
            <span
              className="font-mono"
              style={{ fontSize: 11, color: "var(--hr-fg-3)", letterSpacing: "0.04em", marginLeft: 4 }}
            >
              /мес
            </span>
          </span>
        </div>
      )}
      <a
        href={href}
        style={{
          marginLeft: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "13px 20px",
          background: accentColor,
          color: "#0a0a09",
          borderRadius: 10,
          fontFamily: "var(--font-geist), sans-serif",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {ctaLabel}
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );
}
