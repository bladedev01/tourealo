"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";

const STORAGE_KEY = "tourealo:currency";

export function useCurrency() {
  const settings = useSettings();
  const defaultCurrency = (settings && (settings as any).defaultCurrency) || "USD";
  const [currency, setCurrency] = useState<string>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return stored || defaultCurrency;
    } catch (e) {
      return defaultCurrency;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch (e) {
      // ignore
    }
  }, [currency]);

  return {
    currency,
    setCurrency,
    defaultCurrency,
  } as const;
}
