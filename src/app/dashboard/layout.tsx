"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useLayoutEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/bookings", label: "Reservas" },
  { href: "/dashboard/profile", label: "Perfil" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Use layout effect so the redirect happens before paint and avoids flashing UI.
  useLayoutEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [authLoading, user, pathname, router]);

  // Do not render any placeholder UI while auth is resolving or when unauthenticated.
  // This reduces visible flashes; header remains (from RootLayout) but the dashboard
  // content will not render before the redirect.
  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-3 rounded-3xl bg-white/80 p-4 shadow-sm backdrop-blur">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[140px] flex-1 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow"
                    : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:shadow"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
