"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HireonMark } from "@/components/branding/HireonMark";
import { signOut } from "@/lib/auth-client";
import menuStyles from "./header-menu.module.css";

type HeaderUser = {
  email: string | null;
  name: string | null;
  telegramUsername: string | null;
  id: string;
  role: string | null;
} | null;

function displayLabel(user: NonNullable<HeaderUser>): string {
  if (user.telegramUsername) {
    return `@${user.telegramUsername}`;
  }
  if (user.name) {
    return user.name;
  }
  if (user.email && !user.email.endsWith("@telegram.local")) {
    return user.email;
  }
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
  } else {
    items.push({ name: "Стать продавцом", href: "/seller" });
  }
  if (role === "admin") {
    items.push({ name: "Админка", href: "/admin" });
  }
  items.push({ name: "Дашборд", href: "/dashboard" });
  return items;
}

// Меню в шапке — компактный дроп по дизайну (Menu Button.html).
// Пункты по запросу юзера: Каталог / О проекте / Контакты.
const MENU_ITEMS: { name: string; href: string }[] = [
  { name: "Каталог", href: "/agents" },
  { name: "О проекте", href: "/about" },
  { name: "Контакты", href: "/contacts" },
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
    if (!navDropdown) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setNavDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [navDropdown]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
    <header
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center px-5 sm:px-6">
        <Link
          href="/"
          aria-label="hireon"
          className="mr-8 inline-flex h-11 min-w-11 items-center text-foreground"
        >
          <HireonMark title="hireon" className="h-[22px] w-[22px] text-foreground" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-[14px] font-medium transition-colors ${
                  active ? "text-foreground" : "text-foreground/70 hover:text-foreground"
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

        <div className="ml-auto flex items-center gap-2">
          <div className={`${menuStyles.anchor} inline-flex`} ref={navDropdownRef}>
            <button
              onClick={() => setNavDropdown((open) => !open)}
              className={`${menuStyles.menuBtn}${navDropdown ? " " + menuStyles.isOpen : ""}`}
              aria-label="Меню"
              aria-expanded={navDropdown}
            >
              <svg className={menuStyles.menuIcon} viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <AnimatePresence>
              {navDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14, ease }}
                  className={menuStyles.drop}
                >
                  <span className={`${menuStyles.tick} ${menuStyles.tl}`} />
                  <span className={`${menuStyles.tick} ${menuStyles.tr}`} />
                  <span className={`${menuStyles.tick} ${menuStyles.bl}`} />
                  <span className={`${menuStyles.tick} ${menuStyles.br}`} />
                  {MENU_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setNavDropdown(false)}
                      className={menuStyles.item}
                    >
                      <span className={menuStyles.bullet} />
                      <span>{item.name}</span>
                      <span className={menuStyles.arrow}>→</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((open) => !open)}
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

                      <Link
                        href="/dashboard/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Настройки
                      </Link>

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
              className="hidden h-10 items-center gap-2 rounded-md border border-[oklch(0.68_0.19_195)] bg-[oklch(0.68_0.19_195_/_0.08)] px-4 font-mono text-[13px] font-medium uppercase tracking-[0.1em] text-[oklch(0.68_0.19_195)] transition-[filter,background] hover:bg-[oklch(0.68_0.19_195_/_0.16)] hover:brightness-110 md:inline-flex"
            >
              Войти
            </Link>
          )}

          <button
            type="button"
            className={`-mr-1 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border/40 text-foreground md:hidden ${mobileOpen ? "border-[oklch(0.78_0.13_200)] text-[oklch(0.78_0.13_200)]" : ""}`}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>

    {mobileOpen && (
      <div
        className="fixed inset-x-0 z-40 flex flex-col overflow-y-auto bg-background md:hidden"
        style={{
          top: "calc(3.5rem + env(safe-area-inset-top))",
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
            <nav className="flex flex-col px-5 pt-6">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block border-b border-border/40 py-[14px] font-sans text-[22px] tracking-[-0.02em] transition-colors ${
                      active
                        ? "font-bold text-foreground"
                        : "font-medium text-foreground/80"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {(() => {
              const topHrefs = new Set(navigation.map((n) => n.href));
              const extras = MENU_ITEMS.filter((l) => !topHrefs.has(l.href));
              if (extras.length === 0) return null;
              return (
                <div className="mt-7 px-5">
                  <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
                    Меню
                  </div>
                  {extras.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block border-b border-border/40 py-3 font-sans text-[17px] font-medium text-foreground/80 transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              );
            })()}

            <div className="mt-auto border-t border-border/40 px-5 pb-5 pt-7">
              {user ? (
                <>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 py-2.5 text-[15px] font-medium text-foreground/85"
                  >
                    <Settings className="h-[18px] w-[18px]" />
                    Настройки
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 py-2.5 text-[15px] font-medium text-foreground/85"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-[17px] font-semibold text-foreground"
                >
                  Войти →
                </Link>
              )}
            </div>
      </div>
    )}
    </>
  );
}
