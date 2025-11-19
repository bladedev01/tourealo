"use client";

import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { useLanguagePrefix } from "@/hooks/useLanguagePrefix";

const footerLinks = [
  {
    heading: "Empresa",
    items: [
      { href: "/sobre-nosotros", label: "Sobre nosotros" },
      { href: "/equipo", label: "Nuestro equipo" },
      { href: "/prensa", label: "Prensa" },
    ],
  },
  {
    heading: "Asistencia",
    items: [
      { href: "/ayuda", label: "Centro de ayuda" },
      { href: "/contacto", label: "Contacto" },
      { href: "/terminos", label: "Términos y condiciones" },
    ],
  },
  {
    heading: "Proveedores",
    items: [
      { href: "/proveedores", label: "Únete como proveedor" },
      { href: "/api", label: "API y partnerships" },
      { href: "/guia-marcas", label: "Guía de marca" },
    ],
  },
];

export function Footer() {
  const settings = useSettings();
  // Hide global footer for checkout routes
  try {
    // dynamic import safe access to next/navigation
     
    const { usePathname } = require("next/navigation");
    const pathname = usePathname?.() ?? "";
    if (pathname.includes("/checkout")) return null;
  } catch {
    // ignore on server
  }
  const brandName = settings.appName || "Tourealo";
  const prefix = useLanguagePrefix();
  const resolveHref = (href: string) => {
    if (!prefix) return href;
    if (href === "/") return prefix || "/";
    return `${prefix}${href}`;
  };
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 md:flex-row md:gap-16">
        <div className="max-w-sm flex-1">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
              {brandName.substring(0, 1)}
            </span>
            {brandName}
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Descubre y reserva experiencias únicas alrededor del mundo con proveedores verificados y soporte 24/7.
          </p>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-3">
          {footerLinks.map((section) => (
            <div key={section.heading}>
              <h3 className="text-sm font-semibold text-slate-900">{section.heading}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={resolveHref(item.href)} className="transition-colors hover:text-emerald-600">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white py-4">
  <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} {brandName}. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href={resolveHref("/privacidad")} className="hover:text-emerald-600">
              Aviso de privacidad
            </Link>
            <Link href={resolveHref("/cookies")} className="hover:text-emerald-600">
              Preferencias de cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
