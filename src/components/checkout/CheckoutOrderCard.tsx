"use client";
import React from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  amount?: number;
  currency?: string;
  adults?: string | number;
  children?: string | number;
  date?: string;
  onProceed?: () => void;
  onPay?: () => void;
  disabled?: boolean;
  step?: number;
}

export default function CheckoutOrderCard({ amount, currency = "USD", adults, children, date, onProceed, onPay, disabled, step = 1 }: Props) {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-white border rounded-xl">
        <h3 className="text-sm font-semibold text-slate-700">Tu reserva</h3>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">Adultos</div>
          <div className="text-sm font-medium text-slate-900">{adults ?? 0}</div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-slate-500">Niños</div>
          <div className="text-sm font-medium text-slate-900">{children ?? 0}</div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-slate-500">Fecha</div>
          <div className="text-sm font-medium text-slate-900">{date ?? "-"}</div>
        </div>
        <div className="mt-4 border-t pt-4">
          <div className="flex items-baseline justify-between">
            <div className="text-sm text-slate-500">Total</div>
            <div className="text-2xl font-bold text-emerald-700">{amount ? `${currency} ${amount.toFixed(2)}` : "-"}</div>
          </div>
          <div className="mt-4">
            {step < 4 ? (
              <Button onClick={onProceed} className="w-full">Continuar</Button>
            ) : (
              <Button onClick={onPay} disabled={disabled} className="w-full" variant="primary">
                Pagar {amount ? `· ${currency} ${amount.toFixed(2)}` : ""}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
