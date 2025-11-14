import { cookies, headers } from "next/headers";
import type { Settings } from "@/types/settings";
import { LANGUAGE_COOKIE, ensureSupportedLanguages, normalizeLanguage, type LanguageCode } from "./language-shared";

function parseAcceptLanguage(headerValue: string | null): LanguageCode[] {
  if (!headerValue) return [];
  return headerValue
    .split(",")
    .map((entry) => {
      const [langPart, qualityPart] = entry.trim().split(";q=");
      const normalized = normalizeLanguage(langPart);
      const quality = qualityPart ? Number.parseFloat(qualityPart) || 0 : 1;
      return normalized ? { lang: normalized, quality } : null;
    })
    .filter((item): item is { lang: LanguageCode; quality: number } => Boolean(item && item.lang))
    .sort((a, b) => b.quality - a.quality)
    .map(({ lang }) => lang);
}

export function getSupportedLanguages(settings?: Settings): LanguageCode[] {
  const fromSettings = ensureSupportedLanguages(settings?.availableLanguages);
  const result = Array.from(new Set(fromSettings));
  const defaultNormalized = normalizeLanguage(settings?.defaultLanguage);
  if (defaultNormalized && !result.includes(defaultNormalized)) {
    result.push(defaultNormalized);
  }
  return result;
}

export async function resolveRequestLanguage(settings?: Settings, preferred?: string | null): Promise<LanguageCode> {
  const supported = getSupportedLanguages(settings);
  const defaultNormalized = normalizeLanguage(settings?.defaultLanguage);
  const fallback = defaultNormalized && supported.includes(defaultNormalized)
    ? defaultNormalized
    : supported[0] ?? defaultNormalized ?? "en";

  const normalizedPreferred = normalizeLanguage(preferred);
  if (normalizedPreferred && supported.includes(normalizedPreferred)) {
    return normalizedPreferred;
  }

  const cookieStore = await cookies();
  const cookieLang = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  if (cookieLang && supported.includes(cookieLang)) {
    return cookieLang;
  }

  const headerStore = await headers();
  const headerLangs = parseAcceptLanguage(headerStore.get("accept-language"));
  for (const candidate of headerLangs) {
    if (supported.includes(candidate)) {
      return candidate;
    }
  }

  const defaultLang = normalizeLanguage(settings?.defaultLanguage) || fallback;
  if (supported.includes(defaultLang)) {
    return defaultLang;
  }

  return fallback;
}

export { LANGUAGE_COOKIE } from "./language-shared";
export { normalizeLanguage } from "./language-shared";
