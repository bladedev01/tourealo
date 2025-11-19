"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";

type Tab = "language" | "currency";

export default function LanguageCurrencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language, availableLanguages, setLanguage, isChanging } = useLanguage();
  const { currency, setCurrency, defaultCurrency } = useCurrency();
  const [tab, setTab] = useState<Tab>("language");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted || typeof document === "undefined") return null;

  const settings = useSettings();
  const currenciesFromBackend = Array.isArray(settings.availableCurrencies) && settings.availableCurrencies.length > 0
    ? settings.availableCurrencies
    : ["USD", "EUR", "GBP", "PEN"];
  const currencies = Array.from(new Set([...(defaultCurrency ? [defaultCurrency] : []), ...currenciesFromBackend]));

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl rounded-t-xl sm:rounded-xl bg-white p-4 sm:p-6 shadow-2xl transform translate-y-6 sm:translate-y-4 md:translate-y-0 max-h-[98vh] sm:max-h-[95vh] lg:max-h-[88vh] overflow-auto"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Language & Currency</h3>
            <div className="mt-3 border-b border-slate-100">
              <nav className="flex gap-4">
                <button
                  onClick={() => setTab("language")}
                  className={`px-3 py-2 text-sm font-medium ${tab === "language" ? "border-b-2 border-emerald-500 text-emerald-600" : "text-slate-600"}`}
                >
                  Language
                </button>
                <button
                  onClick={() => setTab("currency")}
                  className={`px-3 py-2 text-sm font-medium ${tab === "currency" ? "border-b-2 border-emerald-500 text-emerald-600" : "text-slate-600"}`}
                >
                  Currency
                </button>
              </nav>
            </div>
          </div>
          <button aria-label="Close" onClick={onClose} className="ml-4 rounded p-1 text-slate-500 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 px-1 sm:px-0">
          {tab === "language" && (
            <div className="grid gap-3">
              {availableLanguages.map((code) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  disabled={isChanging}
                  className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-sm font-medium transition hover:bg-slate-50 ${
                    language === code ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="uppercase">{code}</span>
                  {language === code && <span className="text-emerald-600 text-xs font-semibold">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {tab === "currency" && (
            <div className="grid gap-3">
              {currencies.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(String(c))}
                  className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-sm font-medium transition hover:bg-slate-50 ${
                    currency === c ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="uppercase">{c}</span>
                  {currency === c && <span className="text-emerald-600 text-xs font-semibold">Selected</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
