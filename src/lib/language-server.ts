import { cookies, headers } from "next/headers";
import {
  LANGUAGE_COOKIE,
  ensureSupportedLanguages,
  normalizeLanguage,
  parseAcceptLanguageHeader,
  resolveLanguage,
  type LanguageCode,
  type LanguageResolutionInput,
} from "./language-shared";

export type DetectLanguageOptions = Pick<LanguageResolutionInput, "requestedLanguage" | "availableLanguages" | "fallbackLanguage">;

export async function detectLanguage(options: DetectLanguageOptions = {}): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE)?.value ?? null;
  const middlewareLanguage = headerStore.get("x-tourealo-lang");
  const headerLanguageHeader = headerStore.get("accept-language") ?? undefined;
  const headerLanguages = parseAcceptLanguageHeader(headerLanguageHeader);

  return resolveLanguage({
    ...options,
    requestedLanguage: options.requestedLanguage ?? middlewareLanguage ?? undefined,
    cookieLanguage,
    headerLanguages,
  });
}

export function getAvailableLanguages(raw?: string[] | null, fallback?: string | null): LanguageCode[] {
  const normalized = ensureSupportedLanguages(raw);
    const fallbackNormalized = normalizeLanguage(fallback);
    if (normalized.length > 0) {
      if (fallbackNormalized && !normalized.includes(fallbackNormalized)) {
        return [...normalized, fallbackNormalized];
      }
      return normalized;
    }
    return fallbackNormalized ? [fallbackNormalized] : [];
}

export function getFallbackLanguage(candidate?: string | null, availableLanguages?: string[] | null): LanguageCode {
  const normalizedCandidate = normalizeLanguage(candidate);
  const normalizedAvailable = ensureSupportedLanguages(availableLanguages);
  if (normalizedCandidate && normalizedAvailable.includes(normalizedCandidate)) {
    return normalizedCandidate;
  }
  if (normalizedAvailable.length > 0) {
    return normalizedAvailable[0];
  }
  if (normalizedCandidate) {
    return normalizedCandidate;
  }
  return "en";
}
