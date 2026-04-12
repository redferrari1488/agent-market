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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
            <span className="text-xs font-black leading-none">A</span>
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">AgentMarket</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold">
                  {initial}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-background p-1 shadow-lg">
                    <div className="border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
                      {user.email}
                    </div>
                    {user.role === "buyer" && (
                      <Link
                        href="/seller"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-secondary"
                      >
                        <Store className="h-3.5 w-3.5" />
                        Стать продавцом
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
              className="hidden rounded-lg bg-foreground px-4 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 md:inline-flex"
            >
              Войти
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-secondary md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3 pb-1">
              {user ? (
                <>
                  <div className="pb-2 text-[12px] text-muted-foreground">{user.email}</div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 py-2 text-left text-[14px] text-muted-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex justify-center rounded-lg bg-foreground py-2.5 text-[14px] font-medium text-background"
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
