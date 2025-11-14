"use client";

import { useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "@/hooks/useTranslation";

const LABEL_OVERRIDES: Record<string, string> = {
  es: "ES",
  en: "EN",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, availableLanguages, setLanguage, isChanging } = useLanguage();
  const { t } = useTranslation("frontend-navbar");
  const options = useMemo(
    () =>
      availableLanguages.map((code) => ({
        code,
        label: LABEL_OVERRIDES[code] || code.toUpperCase(),
      })),
    [availableLanguages],
  );

  if (options.length <= 1) {
    return null;
  }

  return (
    <label className={`flex items-center gap-2 text-xs font-semibold text-slate-600 ${className ?? ""}`}>
      <span>{t("language.label", "Idioma")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-700 shadow-sm transition hover:border-emerald-400 focus:border-emerald-500 focus:outline-none"
        disabled={isChanging}
      >
        {options.map((option) => (
          <option key={option.code} value={option.code} className="text-slate-700">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
