import Link from "next/link";
import { HireonLogo } from "@/components/branding/HireonMark";

const SHOWCASE = [
  { label: "Все агенты", href: "/agents" },
  { label: "Поддержка", href: "/agents?category=support" },
  { label: "Контент", href: "/agents?category=content" },
  { label: "Аналитика", href: "/agents?category=analytics" },
];

const SELLERS = [
  { label: "Стать продавцом", href: "/seller" },
  { label: "Документация SDK", href: "/about" },
  { label: "Условия выплат", href: "/terms" },
];

const COMPANY = [
  { label: "О проекте", href: "/about" },
  { label: "Контакты", href: "/contacts" },
  { label: "Политика", href: "/privacy" },
  { label: "Оферта", href: "/terms" },
];

function Column({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h5 className="m-0 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[rgba(241,235,224,0.36)]">
        {title}
      </h5>
      <div className="mt-3.5 flex flex-col">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className="block py-1 text-[13.5px] leading-[2] text-[rgba(241,235,224,0.78)] transition-colors hover:text-[var(--hc-fg,#f1ebe0)]"
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[rgba(244,236,222,0.06)] pt-14 pb-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <Link
              href="/"
              aria-label="hireon"
              className="inline-flex items-center gap-2.5 text-foreground"
            >
              <HireonLogo
                className="inline-flex items-center gap-2"
                markClassName="h-[22px] w-[22px] text-foreground"
                wordmarkClassName="text-[19px] font-extrabold tracking-[-0.028em] text-foreground"
              />
            </Link>
            <p className="mt-3 max-w-[320px] text-[13.5px] leading-[1.6] text-[rgba(241,235,224,0.56)]">
              Маркетплейс отобранных AI-агентов для бизнеса. Запускаются в
              Docker за пять минут.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.15em] text-[rgba(241,235,224,0.36)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              Все системы работают
            </div>
          </div>

          <Column title="Витрина" items={SHOWCASE} />
          <Column title="Продавцам" items={SELLERS} />
          <Column title="Компания" items={COMPANY} />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[rgba(244,236,222,0.06)] pt-5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[rgba(241,235,224,0.36)] sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} hireon.agency</span>
          <span>made in moscow · for russian business</span>
        </div>
      </div>
    </footer>
  );
}
