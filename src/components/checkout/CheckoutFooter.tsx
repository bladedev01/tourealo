"use client";
import React from "react";

export default function CheckoutFooter() {
  return (
    <footer className="w-full border-t border-slate-100 bg-white/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Tourealo. Todos los derechos reservados.</span>
        <div className="flex gap-4">
          <a href="/politicas" className="hover:text-emerald-600">Políticas</a>
          <a href="/ayuda" className="hover:text-emerald-600">Centro de ayuda</a>
          <a href="mailto:soporte@tourealo.com" className="hover:text-emerald-600">soporte@tourealo.com</a>
        </div>
      </div>
    </footer>
  );
}
