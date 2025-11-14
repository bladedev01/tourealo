"use client";

import { createContext, useContext, useMemo } from "react";
import type { Settings } from "@/types/settings";

type SettingsContextValue = {
  settings: Settings;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: Settings;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ settings: initialSettings }), [initialSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettingsContext must be used within SettingsProvider");
  }
  return ctx;
}
