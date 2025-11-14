export const LANGUAGE_COOKIE = "tourealo-lang";
const RAW_ENV_DEFAULT_LANGUAGE = typeof process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE === "string"
  ? process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE
  : undefined;
const HARD_FALLBACK_LANGUAGE = "en";

export type LanguageCode = string;

export function normalizeLanguage(value?: string | null): LanguageCode | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.split(/[._-]/)[0]?.toLowerCase() || null;
}

export function ensureSupportedLanguages(langs?: string[] | null): LanguageCode[] {
  const provided = Array.isArray(langs) && langs.length > 0 ? langs : [];
  const normalized = provided
    .map((lang) => normalizeLanguage(lang))
    .filter((lang): lang is LanguageCode => Boolean(lang));
  return Array.from(new Set(normalized));
}

type WeightedLanguage = {
  code: LanguageCode;
  weight: number;
};

export function parseAcceptLanguageHeader(value?: string | null): LanguageCode[] {
  if (!value) return [];
  const items = value.split(",");
  const weighted: WeightedLanguage[] = [];
  for (const item of items) {
    const [langPart, ...params] = item.trim().split(";");
    const normalized = normalizeLanguage(langPart);
    if (!normalized) continue;
    let weight = 1;
    for (const param of params) {
      const [keyRaw, valRaw] = param.split("=");
      if (keyRaw && keyRaw.trim().toLowerCase() === "q" && valRaw) {
        const parsed = Number(valRaw.trim());
        if (!Number.isNaN(parsed)) {
          weight = parsed;
        }
      }
    }
    weighted.push({ code: normalized, weight });
  }
  return weighted
    .sort((a, b) => b.weight - a.weight)
    .map((item) => item.code);
}

export type LanguageResolutionInput = {
  requestedLanguage?: string | null;
  cookieLanguage?: string | null;
  headerLanguages?: string[];
  availableLanguages?: string[];
  fallbackLanguage?: string | null;
};

export function resolveLanguage({
  requestedLanguage,
  cookieLanguage,
  headerLanguages,
  availableLanguages,
  fallbackLanguage,
}: LanguageResolutionInput = {}): LanguageCode {
  const fallback = normalizeLanguage(fallbackLanguage);
  const available = ensureSupportedLanguages(availableLanguages);
  const candidates: Array<string | null | undefined> = [
    requestedLanguage,
    cookieLanguage,
    ...(headerLanguages ?? []),
  ];
  for (const candidate of candidates) {
    const normalized = normalizeLanguage(candidate);
    if (!normalized) continue;
    if (available.includes(normalized)) {
      return normalized;
    }
  }
  if (fallback && (available.length === 0 || available.includes(fallback))) {
    return fallback;
  }
  if (available.length > 0) {
    return available[0];
  }
  const fallbackCandidate = normalizeLanguage(requestedLanguage)
    || normalizeLanguage(cookieLanguage)
    || normalizeLanguage(headerLanguages?.find(Boolean))
    || normalizeLanguage(RAW_ENV_DEFAULT_LANGUAGE)
    || HARD_FALLBACK_LANGUAGE;
  return fallbackCandidate || HARD_FALLBACK_LANGUAGE;
}
