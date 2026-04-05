"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { createClient } from "@/lib/supabase-browser";

const navigation = [
  { name: "Каталог", href: "/agents" },
  { name: "Дашборд", href: "/dashboard" },
  { name: "Для продавцов", href: "/seller" },
];

type HeaderUser = { email: string | null; id: string } | null;

export function Header({ user }: { user: HeaderUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const initial = user?.email?.[0]?.toUpperCase() || "U";

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

          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold hover:bg-secondary/80"
              >
                {initial}
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-background p-1 shadow-lg">
                    <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden rounded-full bg-foreground px-4 py-1.5 text-sm font-bold text-background transition-opacity hover:opacity-90 md:inline-flex"
            >
              Войти
            </Link>
          )}

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
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    {user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex justify-center rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background"
                  onClick={() => setMobileOpen(false)}
                >
                  Войти
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
