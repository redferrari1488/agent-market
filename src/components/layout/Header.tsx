"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { monoStyle, onestStyle } from "@/components/landing/redesign/shared";

// Header (Hireon Redesign 2026-05-16): floating pill в духе HeaderA.
// На десктопе — центрированная капсула с лого + nav + поиск + аватар.
// На мобайле — sticky pill с гамбургером, открывающим overlay-меню.

type HeaderUser = {
  email: string | null;
  name: string | null;
  telegramUsername: string | null;
  id: string;
  role: string | null;
} | null;

const ease = [0.16, 1, 0.3, 1] as const;

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

function buildNavigation(role: string | null) {
  const items: Array<{ id: string; label: string; href: string; sub?: string }> = [
    { id: "catalog", label: "Каталог", href: "/agents", sub: "AI-агенты по категориям" },
  ];
  if (role === "seller" || role === "admin") {
    items.push({ id: "seller", label: "Продавцам", href: "/seller", sub: "панель продавца" });
  } else {
    items.push({
      id: "seller",
      label: "Стать продавцом",
      href: "/seller",
      sub: "набор первой волны · бесплатно",
    });
  }
  if (role === "admin") {
    items.push({ id: "admin", label: "Админка", href: "/admin", sub: "управление платформой" });
  }
  items.push({ id: "dashboard", label: "Дашборд", href: "/dashboard", sub: "управление подписками" });
  return items;
}

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigation = buildNavigation(user?.role ?? null);
  const label = user ? displayLabel(user) : "";
  const initial = user ? displayInitial(label) : "U";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  // Закрываем мобильное меню по Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <>
      <header
        className="hr-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          padding: "12px 14px 8px",
          background:
            "linear-gradient(180deg, rgba(20,20,24,0.92) 0%, rgba(20,20,24,0.55) 80%, transparent 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          paddingTop: "calc(12px + env(safe-area-inset-top))",
        }}
      >
        <div
          className="hr-pill"
          style={{
            ...onestStyle,
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 8px 8px 18px",
            background: "rgba(28,28,34,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--hr-border-1)",
            borderRadius: 999,
            boxShadow:
              "0 12px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(244,236,222,0.04)",
            maxWidth: "min(100%, 1080px)",
          }}
        >
          <Link
            href="/"
            aria-label="hireon"
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              paddingRight: 14,
              borderRight: "1px solid var(--hr-border-1)",
              color: "var(--hr-fg-1)",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-onest), 'Onest', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: "-0.025em",
                lineHeight: 1,
                color: "var(--hr-fg-1)",
              }}
            >
              hire
              <span style={{ color: "var(--hr-teal)" }}>.</span>
              on
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hr-nav-desktop"
            style={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            {navigation.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.id}
                  href={it.href}
                  style={{
                    padding: "9px 14px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: active ? "var(--hr-fg-1)" : "var(--hr-fg-3)",
                    background: active ? "var(--hr-bg-elev-2)" : "transparent",
                    borderRadius: 999,
                    textDecoration: "none",
                    transition: "color .15s, background .15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <span
            className="hr-divider-desktop"
            style={{
              width: 1,
              height: 22,
              background: "var(--hr-border-1)",
              margin: "0 4px",
            }}
          />

          {/* Search (only desktop) */}
          <Link
            href="/agents"
            aria-label="Поиск агента"
            className="hr-search-desktop"
            style={{
              ...monoStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--hr-bg-elev-2)",
              border: "none",
              borderRadius: 999,
              padding: "8px 12px",
              color: "var(--hr-fg-3)",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.04em",
              textDecoration: "none",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <span style={{ textTransform: "uppercase" }}>поиск</span>
          </Link>

          {/* Profile / Login */}
          {user ? (
            <div className="hr-profile-desktop" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Профиль"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px 2px 2px",
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--hr-teal)",
                    color: "#062e36",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {initial}
                </span>
                <ChevronDown style={{ width: 10, height: 10, color: "var(--hr-fg-3)" }} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 40 }}
                      onClick={() => setProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease }}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        zIndex: 50,
                        width: 220,
                        background: "var(--hr-bg-elev)",
                        border: "1px solid var(--hr-border-1)",
                        borderRadius: 12,
                        padding: 4,
                        boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
                      }}
                    >
                      <div
                        style={{
                          ...monoStyle,
                          padding: "8px 12px",
                          fontSize: 11,
                          color: "var(--hr-fg-3)",
                          borderBottom: "1px solid var(--hr-border-1)",
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </div>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--hr-fg-2)",
                          borderRadius: 8,
                          textDecoration: "none",
                        }}
                      >
                        <Settings style={{ width: 14, height: 14 }} />
                        Настройки
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--hr-fg-2)",
                          background: "transparent",
                          border: "none",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          borderRadius: 8,
                          fontFamily: "inherit",
                        }}
                      >
                        <LogOut style={{ width: 14, height: 14 }} />
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
              className="hr-login-desktop"
              style={{
                background: "var(--hr-teal)",
                color: "#062e36",
                padding: "9px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Войти
            </Link>
          )}

          {/* Mobile: hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="hr-burger-mobile"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--hr-bg-elev-2)",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              color: "var(--hr-fg-1)",
              cursor: "pointer",
              padding: 0,
              marginLeft: 2,
            }}
          >
            {menuOpen ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <>
                <span
                  style={{
                    width: 14,
                    height: 1.5,
                    background: "currentColor",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 1.5,
                    background: "currentColor",
                    display: "block",
                    alignSelf: "flex-end",
                    marginRight: 10,
                  }}
                />
              </>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease }}
            style={{
              ...onestStyle,
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "rgba(15,14,12,0.92)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              padding: "calc(78px + env(safe-area-inset-top)) 18px 30px",
              overflow: "auto",
            }}
          >
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => setMenuOpen(false)}
              style={{
                position: "absolute",
                top: "calc(22px + env(safe-area-inset-top))",
                right: 22,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--hr-bg-elev-2)",
                border: "1px solid var(--hr-border-1)",
                color: "var(--hr-fg-1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {navigation.map((it) => (
                <Link
                  key={it.id}
                  href={it.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "18px",
                    background: "var(--hr-bg-elev)",
                    border: "1px solid var(--hr-border-1)",
                    borderRadius: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--hr-fg-1)",
                      }}
                    >
                      {it.label}
                    </div>
                    {it.sub && (
                      <div
                        style={{
                          ...monoStyle,
                          fontSize: 10.5,
                          color: "var(--hr-fg-3)",
                          marginTop: 4,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {it.sub}
                      </div>
                    )}
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--hr-fg-3)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ))}
            </div>

            <div
              style={{
                marginTop: 22,
                paddingTop: 22,
                borderTop: "1px solid var(--hr-border-1)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {user ? (
                <>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "14px 8px",
                      fontSize: 15,
                      color: "var(--hr-fg-1)",
                      textDecoration: "none",
                    }}
                  >
                    <Settings style={{ width: 18, height: 18 }} />
                    Настройки
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "14px 8px",
                      fontSize: 15,
                      color: "var(--hr-fg-1)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <LogOut style={{ width: 18, height: 18 }} />
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    background: "var(--hr-teal)",
                    color: "#062e36",
                    padding: "14px 18px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  Войти
                </Link>
              )}
              <div
                style={{
                  ...monoStyle,
                  fontSize: 11,
                  color: "var(--hr-fg-3)",
                  textAlign: "center",
                  marginTop: 4,
                  letterSpacing: "0.08em",
                }}
              >
                RU + crypto · 0% комиссия первой волны
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (max-width: 880px) {
          .hr-nav-desktop,
          .hr-divider-desktop,
          .hr-search-desktop,
          .hr-profile-desktop,
          .hr-login-desktop {
            display: none !important;
          }
        }
        @media (min-width: 881px) {
          .hr-burger-mobile {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
