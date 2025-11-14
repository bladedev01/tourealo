"use client";

import { useLanguageContext } from "@/providers/LanguageProvider";

export function useLanguage() {
  return useLanguageContext();
}
