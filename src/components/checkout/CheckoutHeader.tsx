"use client";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/Button";

export default function CheckoutHeader() {
  return (
    <header className="w-full border-b border-emerald-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Tourealo</p>
          <h1 className="text-lg font-bold text-slate-900">Completa tu reserva</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>¿Necesitas ayuda?</span>
          <Button variant="secondary" size="sm" href="/contacto">
            Contactar soporte
          </Button>
        </div>
      </div>
    </header>
  );
}
