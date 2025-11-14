"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/hooks/useSettings";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
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
          <LanguageSwitcher />
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
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-100 bg-white shadow-lg">
                  <div className="flex flex-col p-2">
                    <Link
                      href={`${prefix}/dashboard`}
                      className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {/* 'Become a supplier' removed for authenticated users per request */}
                    <button
                      onClick={() => {
                        void logout();
                        setMenuOpen(false);
                      }}
                      className="mt-1 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Logout
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
        <Button size="sm" variant="ghost" className="md:hidden">
          {t("mobile.menu", "Menú")}
        </Button>
      </div>
    </header>
  );
}
