"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { LanguageCode } from "@/lib/language-shared";

export type LanguageServerContextValue = {
  language: LanguageCode;
  defaultLanguage: LanguageCode | "";
  fallbackLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
};

const LanguageServerContext = createContext<LanguageServerContextValue | null>(null);
LanguageServerContext.displayName = "LanguageServerContext";

export function LanguageServerProvider({
  value,
  children,
}: {
  value: LanguageServerContextValue;
  children: ReactNode;
}) {
  return <LanguageServerContext.Provider value={value}>{children}</LanguageServerContext.Provider>;
}

export function useLanguageServer() {
  const ctx = useContext(LanguageServerContext);
  if (!ctx) {
    throw new Error("useLanguageServer must be used within a LanguageServerProvider");
  }
  return ctx;
}

export { LanguageServerContext };
