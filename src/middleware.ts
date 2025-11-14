import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LANGUAGE_COOKIE, ensureSupportedLanguages, normalizeLanguage, type LanguageCode } from "@/lib/language-shared";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const LANGUAGE_CACHE_TTL = 60_000; // 1 minute

type LanguageSettings = {
  availableLanguages: LanguageCode[];
  fallbackLanguage: LanguageCode;
  defaultLanguage: LanguageCode | "";
};

let languageSettingsCache: { value: LanguageSettings; expiresAt: number } | null = null;

function getApiBaseUrl() {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  return typeof base === "string" && base.length > 0 ? base.replace(/\/$/, "") : null;
}

async function fetchLanguageSettings(): Promise<LanguageSettings> {
  const now = Date.now();
  if (languageSettingsCache && languageSettingsCache.expiresAt > now) {
    return languageSettingsCache.value;
  }

  const envDefault = normalizeLanguage(process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE) || "en";
  const fallbackLanguage = envDefault;
  const fallbackLanguages = ensureSupportedLanguages([envDefault]);
  const normalizedFallbackList = fallbackLanguages.length > 0 ? fallbackLanguages : [fallbackLanguage];
  const fallbackSettings: LanguageSettings = {
    availableLanguages: normalizedFallbackList,
    fallbackLanguage,
    defaultLanguage: "",
  };

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    languageSettingsCache = {
      value: fallbackSettings,
      expiresAt: now + LANGUAGE_CACHE_TTL,
    };
    return fallbackSettings;
  }

  try {
    const response = await fetch(`${apiBase}/settings`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`);
    }
    const data = (await response.json()) as { availableLanguages?: string[]; defaultLanguage?: string };
    let availableLanguages = ensureSupportedLanguages(data.availableLanguages);
    const defaultCandidate = normalizeLanguage(data.defaultLanguage);
    if (availableLanguages.length === 0 && defaultCandidate) {
      availableLanguages = [defaultCandidate];
    }
    if (availableLanguages.length === 0) {
      availableLanguages = [...fallbackSettings.availableLanguages];
    }
    const fallbackLanguageResolved = defaultCandidate
      ?? availableLanguages[0]
      ?? fallbackSettings.fallbackLanguage;
    if (!availableLanguages.includes(fallbackLanguageResolved)) {
      availableLanguages = [...availableLanguages, fallbackLanguageResolved];
    }
    const value: LanguageSettings = {
      availableLanguages,
      fallbackLanguage: fallbackLanguageResolved,
      defaultLanguage: defaultCandidate ?? "",
    };
    languageSettingsCache = {
      value,
      expiresAt: now + LANGUAGE_CACHE_TTL,
    };
    return value;
  } catch (error) {
    console.warn("Failed to load language settings in middleware", error);
    languageSettingsCache = {
      value: fallbackSettings,
      expiresAt: now + LANGUAGE_CACHE_TTL,
    };
    return fallbackSettings;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/([a-zA-Z]{2,3}(?:-[a-zA-Z]{2})?)(\/.*)?$/);
  if (!match) {
    return NextResponse.next();
  }

  const { availableLanguages, defaultLanguage } = await fetchLanguageSettings();

  const localeCandidate = normalizeLanguage(match[1]);
  if (!localeCandidate || !availableLanguages.includes(localeCandidate)) {
    return NextResponse.next();
  }

  const restPath = match[2] ?? "/";

  if (defaultLanguage && localeCandidate === defaultLanguage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = restPath;
    redirectUrl.searchParams.delete("lang");
    const redirectResponse = NextResponse.redirect(redirectUrl, 308);
    redirectResponse.cookies.set(LANGUAGE_COOKIE, localeCandidate, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
    return redirectResponse;
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = restPath;
  rewriteUrl.searchParams.set("lang", localeCandidate);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tourealo-lang", localeCandidate);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set(LANGUAGE_COOKIE, localeCandidate, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|_static|_vercel|favicon.ico|robots.txt|sitemap.xml|api).*)",
  ],
};
