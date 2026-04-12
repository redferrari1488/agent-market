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
        <div className="grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-baseline gap-0">
              <span className="text-[15px] font-bold tracking-[-0.02em]">agent</span>
              <span className="font-mono text-[15px] font-bold tracking-[-0.02em] text-muted-foreground">market</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Маркетплейс рабочих AI-агентов. Выбери, настрой, запусти.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
                {col.title}
              </div>
              <ul className="mt-3 space-y-2">
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

        <div className="border-t border-border/40 py-5">
          <p className="text-[12px] text-muted-foreground/50">
            &copy; {new Date().getFullYear()} AgentMarket
          </p>
        </div>
      </div>
    </footer>
  );
}
