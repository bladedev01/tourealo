"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/hooks/useSettings";
import LanguageCurrencyModal from "@/components/ui/LanguageCurrencyModal";
import { Grid, Calendar, User, LogOut, Globe2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguagePrefix } from "@/hooks/useLanguagePrefix";

export function Header() {
  const pathname = usePathname?.() ?? "";
  // Hide global header for checkout routes (including language-prefixed ones)
  if (pathname.includes("/checkout")) return null;
  const settings = useSettings();
  const brandName = settings.appName || "Tourealo";
  const { t } = useTranslation("frontend-navbar");
  const prefix = useLanguagePrefix();
  const homeHref = prefix || "/";
  const navItems = [
    { href: `${prefix}/tours`, label: t("nav.tours", "Tours") },
    { href: `${prefix}/destinations`, label: t("nav.destinations", "Destinations") },
    { href: `${prefix}/experiences`, label: t("nav.experiences", "Experiences") },
    { href: `${prefix}/blog`, label: t("nav.blog", "Blog") },
  ];
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      // close user menu when clicking outside user menu
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      // If mobile panel is open, and the click occurred inside the panel, ignore
      if (mobileOpen && mobilePanelRef.current && target && mobilePanelRef.current.contains(target)) {
        return;
      }
      // close mobile panel when clicking outside the mobile panel
      if (mobileOpen && mobilePanelRef.current && target && !mobilePanelRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [mobileOpen]);

  // Lock body scroll when mobile panel is open and add ESC key to close
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = prevOverflow || "";
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/90">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
  <Link href={homeHref} className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white uppercase">
            {brandName.substring(0, 1)}
          </span>
          <span>{brandName}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-emerald-600">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <button
            onClick={() => setLangOpen(true)}
            aria-label="Open language & currency selector"
            className="inline-flex h-9 w-9 items-center justify-center text-slate-700 transition hover:text-emerald-600"
            type="button"
          >
            <Globe2 className="h-5 w-5" />
          </button>
          <LanguageCurrencyModal open={langOpen} onClose={() => setLangOpen(false)} />
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-slate-50"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white uppercase overflow-hidden">
                  {user.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photo} alt={user.name || "User"} className="h-9 w-9 object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{(user.name || user.email || "U").slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-100 bg-white shadow-lg">
                  <div className="flex flex-col p-2">
                    <Link
                      href={`${prefix}/dashboard`}
                      className="flex items-center gap-3 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Grid className="h-4 w-4" />
                      </span>
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href={`${prefix}/dashboard/bookings`}
                      className="flex items-center gap-3 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <span>Bookings</span>
                    </Link>
                    <Link
                      href={`${prefix}/dashboard/profile`}
                      className="flex items-center gap-3 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <User className="h-4 w-4" />
                      </span>
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        void logout();
                        setMenuOpen(false);
                      }}
                      className="mt-1 flex items-center gap-3 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <LogOut className="h-4 w-4" />
                      </span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href={`${prefix}/login`} className="text-sm font-semibold text-slate-700 hover:text-emerald-600">
              Login
            </Link>
          )}
          {!user && (
            <Link href={`${prefix}/become-supplier`}>
              <Button size="sm" variant="primary" className="shadow-sm">
                Become a supplier
              </Button>
            </Link>
          )}
        </div>
        <button
          type="button"
          aria-label={t("mobile.menu", "Menú")}
          onClick={() => setMobileOpen((s) => !s)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)}>
            <div
              ref={mobilePanelRef}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 z-60 flex h-full w-full flex-col bg-gradient-to-b from-white via-white to-emerald-50 text-slate-900 shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3 text-lg font-semibold">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white uppercase">
                    {brandName.substring(0, 1)}
                  </span>
                  <span>{brandName}</span>
                </div>
                <button
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                >
                  ×
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6 text-lg">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-transparent bg-white/80 px-4 py-3 font-semibold text-slate-900 shadow-sm transition hover:border-emerald-200 hover:bg-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setLangOpen(true);
                    setMobileOpen(false);
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Globe2 className="h-5 w-5" />
                  <span>{t("mobile.language", "Idioma / Moneda")}</span>
                </button>
              </nav>
              <div className="border-t border-slate-200 px-6 py-5">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      href={`${prefix}/dashboard`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-base font-semibold text-white shadow-lg shadow-emerald-200"
                    >
                      {t("mobile.dashboard", "Ir al dashboard")}
                    </Link>
                    <button
                      onClick={() => {
                        void logout();
                        setMobileOpen(false);
                      }}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
                    >
                      {t("mobile.logout", "Cerrar sesión")}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href={`${prefix}/login`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-base font-semibold text-white shadow-lg shadow-emerald-200"
                    >
                      {t("mobile.login", "Iniciar sesión")}
                    </Link>
                    <Link
                      href={`${prefix}/become-supplier`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-base font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      {t("mobile.becomeSupplier", "Conviértete en proveedor")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
