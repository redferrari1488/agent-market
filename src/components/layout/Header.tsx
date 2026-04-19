"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LogOut, Store, ChevronDown, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/lib/auth-client";

type HeaderUser = {
  email: string | null;
  name: string | null;
  telegramUsername: string | null;
  id: string;
  role: string | null;
} | null;

// У Telegram-юзеров email синтетический (tg_<id>@telegram.local) — его
// показывать нельзя. Берём username / name, и только если их нет —
// email, и то скрываем technical-домен.
function displayLabel(user: NonNullable<HeaderUser>): string {
  if (user.telegramUsername) return `@${user.telegramUsername}`;
  if (user.name) return user.name;
  if (user.email && !user.email.endsWith("@telegram.local")) return user.email;
  return "Пользователь";
}

function displayInitial(label: string): string {
  const trimmed = label.replace(/^@/, "").trim();
  return trimmed[0]?.toUpperCase() || "U";
}

const ease = [0.16, 1, 0.3, 1] as const;

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

const extraNav = [
  {
    group: "Платформа",
    links: [
      { name: "Каталог", href: "/agents" },
    ],
  },
  {
    group: "Продавцам",
    links: [
      { name: "Стать продавцом", href: "/seller" },
      { name: "Создать агента", href: "/seller/agents/new" },
    ],
  },
  {
    group: "Компания",
    links: [
      { name: "О проекте", href: "/about" },
      { name: "Контакты", href: "/contacts" },
    ],
  },
];

export function Header({ user }: { user: HeaderUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navDropdown, setNavDropdown] = useState(false);
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const navigation = getNavigation(user?.role ?? null);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const label = user ? displayLabel(user) : "";
  const initial = user ? displayInitial(label) : "U";

  useEffect(() => {
    if (!navDropdown) return;
    function handleClick(e: MouseEvent) {
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target as Node)) {
        setNavDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [navDropdown]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-5 sm:px-6">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-baseline gap-0">
          <span className="text-[15px] font-bold tracking-[-0.02em]">hireon</span>
          <span className="font-mono text-[15px] font-bold tracking-[-0.02em] text-muted-foreground">.agency</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-[13px] transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-foreground"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          {/* Nav dropdown (desktop) */}
          <div className="relative hidden md:block" ref={navDropdownRef}>
            <button
              onClick={() => setNavDropdown(!navDropdown)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Навигация"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {navDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease }}
                  className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-lg border border-border bg-background p-1 shadow-lg"
                >
                  {extraNav.map((section, si) => (
                    <div key={section.group}>
                      {si > 0 && <div className="my-1 border-t border-border/40" />}
                      <div className="px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
                        {section.group}
                      </div>
                      {section.links.map((link) => (
                        <Link
                          key={link.href + link.name}
                          href={link.href}
                          onClick={() => setNavDropdown(false)}
                          className="flex w-full items-center rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                <motion.span
                  animate={{ rotate: menuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3" />
                </motion.span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease }}
                      className="absolute right-0 top-full z-50 mt-2 w-52 origin-top-right rounded-lg border border-border bg-background p-1 shadow-lg"
                    >
                      <div className="border-b border-border/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {label}
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
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
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
            className="-mr-2 flex h-10 w-10 items-center justify-center md:hidden"
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden border-t border-border/40 bg-background md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3">
              {navigation.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25, ease }}
                  >
                    <Link
                      href={item.href}
                      className={`block py-2.5 text-[14px] transition-colors ${
                        active ? "text-foreground" : "text-muted-foreground"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Extra nav sections */}
              {extraNav.map((section) => (
                <div key={section.group} className="mt-2 border-t border-border/40 pt-2">
                  <div className="py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
                    {section.group}
                  </div>
                  {section.links.map((link) => (
                    <Link
                      key={link.href + link.name}
                      href={link.href}
                      className="block py-2 text-[14px] text-muted-foreground transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
