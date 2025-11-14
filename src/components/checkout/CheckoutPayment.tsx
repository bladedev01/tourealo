import React from "react";
import { Button } from "@/components/ui/Button";

interface CheckoutPaymentProps {
  loading: boolean;
  onPay: () => void;
  disabled?: boolean;
  amount?: number;
  currency?: string;
  paymentMethod?: "stripe" | "paypal";
  onPaymentMethodChange?: (method: "stripe" | "paypal") => void;
  enabledMethods?: ("stripe" | "paypal")[];
}

const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  loading,
  onPay,
  disabled,
  amount,
  currency,
  paymentMethod = "stripe",
  onPaymentMethodChange,
  enabledMethods = ["stripe", "paypal"],
}) => {
  const formattedTotal = amount != null && !Number.isNaN(amount)
    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "USD" }).format(amount)
    : "-";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-600">Total a pagar</span>
          <span className="text-lg font-bold text-emerald-600">{formattedTotal}</span>
        </div>
      </div>
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Método de pago</label>
      <div className="grid gap-3 sm:grid-cols-2">
        {enabledMethods.includes("stripe") && (
          <button
            type="button"
            onClick={() => onPaymentMethodChange?.("stripe")}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${paymentMethod === "stripe" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-emerald-200"}`}
          >
            Tarjeta (Stripe)
          </button>
        )}
        {enabledMethods.includes("paypal") && (
          <button
            type="button"
            onClick={() => onPaymentMethodChange?.("paypal")}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${paymentMethod === "paypal" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-emerald-200"}`}
          >
            PayPal
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Serás redirigido al proveedor elegido para completar el pago de forma segura.
      </p>
    </div>
      <Button variant="primary" className="w-full mt-2" onClick={onPay} disabled={loading || disabled}>
        {loading ? "Procesando…" : "Confirmar y pagar"}
      </Button>
    </div>
  );
};

export default CheckoutPayment;
