"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogOut, Store, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/lib/auth-client";

type HeaderUser = { email: string | null; id: string; role: string | null } | null;

function getNavigation(role: string | null) {
  const items = [{ name: "Каталог", href: "/agents" }];
  if (role === "seller" || role === "admin") {
    items.push({ name: "Продавцам", href: "/seller" });
  }
  if (role === "admin") {
    items.push({ name: "Админка", href: "/admin" });
  }
  items.push({ name: "Дашборд", href: "/dashboard" });
  return items;
}

export function Header({ user }: { user: HeaderUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = getNavigation(user?.role ?? null);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const initial = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-5 sm:px-6">
        {/* Logo — wordmark with mono accent */}
        <Link href="/" className="mr-8 flex items-baseline gap-0">
          <span className="text-[15px] font-bold tracking-[-0.02em]">agent</span>
          <span className="font-mono text-[15px] font-bold tracking-[-0.02em] text-muted-foreground">market</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 font-mono text-[10px] font-medium">
                  {initial}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-border bg-background p-1 shadow-lg">
                    <div className="border-b border-border/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {user.email}
                    </div>
                    {user.role === "buyer" && (
                      <Link
                        href="/seller"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors hover:bg-secondary"
                      >
                        <Store className="h-3.5 w-3.5" />
                        Стать продавцом
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Войти
            </Link>
          )}

          <button
            className="flex h-8 w-8 items-center justify-center md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2.5 text-[14px] text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-2 border-t border-border/40 pt-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 text-[14px] text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="py-2 text-[14px] font-medium"
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
