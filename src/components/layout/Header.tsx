"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
  { name: "Каталог", href: "/agents" },
  { name: "Дашборд", href: "/dashboard" },
  { name: "Для продавцов", href: "/seller" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-base font-bold tracking-tight">AgentMarket</span>
        </Link>

        {/* Десктопная навигация */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Правая часть */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="hidden rounded-full bg-foreground px-4 py-1.5 text-sm font-bold text-background transition-opacity hover:opacity-90 md:inline-flex"
          >
            Войти
          </Link>

          {/* Мобильное меню */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Мобильная навигация */}
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              <Link
                href="/auth/login"
                className="flex justify-center rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background"
                onClick={() => setMobileOpen(false)}
              >
                Войти
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
