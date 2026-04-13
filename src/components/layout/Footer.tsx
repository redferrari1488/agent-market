import Link from "next/link";

const columns = [
  {
    title: "Платформа",
    links: [
      { name: "Каталог", href: "/agents" },
      { name: "Поддержка", href: "/agents?category=support" },
      { name: "Контент", href: "/agents?category=content" },
      { name: "Мониторинг", href: "/agents?category=monitoring" },
    ],
  },
  {
    title: "Продавцам",
    links: [
      { name: "Стать продавцом", href: "/seller" },
      { name: "Создать агента", href: "/seller/agents/new" },
    ],
  },
  {
    title: "Компания",
    links: [
      { name: "О проекте", href: "/about" },
      { name: "Конфиденциальность", href: "/privacy" },
      { name: "Условия", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-baseline gap-0">
              <span className="text-[15px] font-bold tracking-[-0.02em]">agent</span>
              <span className="font-mono text-[15px] font-bold tracking-[-0.02em] text-muted-foreground">
                market
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Маркетплейс рабочих AI-агентов. Выбери, настрой, запусти.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              Все системы работают
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-border/40 py-5 sm:flex-row sm:items-center">
          <p className="text-[12px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} AgentMarket. Все права защищены.
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground/40">
            Сделано в России
          </p>
        </div>
      </div>
    </footer>
  );
}
