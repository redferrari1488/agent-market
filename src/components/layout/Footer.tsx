import Link from "next/link";
import { Bot } from "lucide-react";

const links = {
  platform: [
    { name: "Каталог агентов", href: "/agents" },
    { name: "Поддержка", href: "/agents?category=support" },
    { name: "Контент", href: "/agents?category=content" },
    { name: "Мониторинг", href: "/agents?category=monitoring" },
  ],
  sellers: [
    { name: "Стать продавцом", href: "/seller" },
    { name: "Опубликовать агента", href: "/seller/agents/new" },
  ],
  info: [
    { name: "О нас", href: "#" },
    { name: "Конфиденциальность", href: "#" },
    { name: "Условия", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Бренд */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">AgentMarket</span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Маркетплейс готовых AI-агентов.
            </p>
          </div>

          {/* Платформа */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Платформа
            </h3>
            <ul className="mt-3 space-y-1.5">
              {links.platform.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Для продавцов */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Продавцам
            </h3>
            <ul className="mt-3 space-y-1.5">
              {links.sellers.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Информация */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Информация
            </h3>
            <ul className="mt-3 space-y-1.5">
              {links.info.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} AgentMarket
          </p>
        </div>
      </div>
    </footer>
  );
}
