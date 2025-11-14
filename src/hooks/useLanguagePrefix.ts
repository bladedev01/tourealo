import { useMemo } from "react";
import { normalizeLanguage } from "@/lib/language-shared";
import { useLanguage } from "@/hooks/useLanguage";

export function useLanguagePrefix() {
  const { language, defaultLanguage } = useLanguage();
  return useMemo(() => {
    const normalizedLanguage = normalizeLanguage(language);
    const normalizedDefault = normalizeLanguage(defaultLanguage);
    if (!normalizedLanguage || normalizedLanguage === normalizedDefault) {
      return "";
    }
    return `/${normalizedLanguage}`;
  }, [defaultLanguage, language]);
}
