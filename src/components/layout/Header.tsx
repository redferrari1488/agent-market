"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
  { name: "Каталог", href: "/agents" },
  { name: "Дашборд", href: "/dashboard" },
  { name: "Для продавцов", href: "/seller" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-500">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold">AgentMarket</span>
        </Link>

        {/* Десктопная навигация */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden bg-gradient-to-r from-violet-600 to-blue-500 text-white hover:from-violet-700 hover:to-blue-600 md:inline-flex"
            )}
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
        <div className="border-t border-border/50 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-2 bg-gradient-to-r from-violet-600 to-blue-500 text-white"
              )}
            >
              Войти
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
