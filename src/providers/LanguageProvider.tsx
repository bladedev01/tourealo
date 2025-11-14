"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LANGUAGE_COOKIE, ensureSupportedLanguages, normalizeLanguage, type LanguageCode } from "@/lib/language-shared";

export type LanguageContextValue = {
  language: LanguageCode;
  defaultLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  setLanguage: (language: LanguageCode) => void;
  isChanging: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
LanguageContext.displayName = "LanguageContext";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function LanguageProvider({
  initialLanguage,
  availableLanguages,
  defaultLanguage,
  fallbackLanguage,
  children,
}: {
  initialLanguage: string;
  availableLanguages: string[];
  defaultLanguage: string;
  fallbackLanguage: string;
  children: React.ReactNode;
}) {
  const normalizedAvailable = useMemo(() => ensureSupportedLanguages(availableLanguages), [availableLanguages]);
  const normalizedDefault = useMemo(() => normalizeLanguage(defaultLanguage), [defaultLanguage]);
  const normalizedFallback = useMemo(() => normalizeLanguage(fallbackLanguage) || "en", [fallbackLanguage]);
  const resolvedAvailable = useMemo(() => {
    const unique = new Set<string>();
    const ordered: LanguageCode[] = [];
    for (const lang of normalizedAvailable) {
      if (!unique.has(lang)) {
        unique.add(lang);
        ordered.push(lang);
      }
    }
    const addIfMissing = (lang: LanguageCode | null) => {
      if (lang && !unique.has(lang)) {
        unique.add(lang);
        ordered.push(lang);
      }
    };
    addIfMissing(normalizedDefault);
    addIfMissing(normalizedFallback);
    if (ordered.length === 0) {
      ordered.push(normalizedFallback);
    }
    return ordered;
  }, [normalizedAvailable, normalizedDefault, normalizedFallback]);
  const defaultForPrefix = useMemo(() => normalizedDefault ?? "", [normalizedDefault]);
  const fallbackForState = useMemo(() => {
    if (normalizedDefault) {
      return normalizedDefault;
    }
    if (resolvedAvailable.length > 0) {
      return resolvedAvailable[0];
    }
    return normalizedFallback;
  }, [normalizedDefault, normalizedFallback, resolvedAvailable]);
  const normalizedInitial = useMemo(() => {
    const normalized = normalizeLanguage(initialLanguage);
    if (normalized && resolvedAvailable.includes(normalized)) {
      return normalized;
    }
    if (normalized) {
      return normalized;
    }
    return fallbackForState;
  }, [initialLanguage, resolvedAvailable, fallbackForState]);

  const [language, setLanguageState] = useState<LanguageCode>(normalizedInitial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stripLanguagePrefix = useCallback(
    (path: string) => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const segments = normalizedPath.split("/");
      const candidate = segments[1]?.toLowerCase();
      if (candidate && resolvedAvailable.includes(candidate)) {
        const restSegments = segments.slice(2).filter(Boolean);
        return restSegments.length ? `/${restSegments.join("/")}` : "/";
      }
      return normalizedPath;
    },
    [resolvedAvailable],
  );

  const buildLocalizedPath = useCallback(
    (targetLanguage: LanguageCode) => {
      const basePath = stripLanguagePrefix(pathname || "/");
      const normalizedTarget = normalizeLanguage(targetLanguage) || fallbackForState;
      const shouldHidePrefix = defaultForPrefix && normalizedTarget === defaultForPrefix;
      const prefix = shouldHidePrefix ? "" : `/${normalizedTarget}`;
      const normalizedBase = basePath === "/" ? "" : basePath;
      const localizedPath = (() => {
        if (!prefix) {
          return normalizedBase || "/";
        }
        if (!normalizedBase) {
          return prefix;
        }
        return `${prefix}${normalizedBase.startsWith("/") ? normalizedBase : `/${normalizedBase}`}`;
      })();
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("lang");
      const query = params.toString();
      return query ? `${localizedPath}?${query}` : localizedPath;
    },
    [pathname, defaultForPrefix, fallbackForState, searchParams, stripLanguagePrefix],
  );

  const setLanguage = useCallback(
    (nextLanguage: LanguageCode) => {
      const normalized = normalizeLanguage(nextLanguage);
      const resolved = normalized && resolvedAvailable.includes(normalized)
        ? normalized
        : normalized ?? fallbackForState;
      setLanguageState(resolved);
      try {
        document.cookie = `${LANGUAGE_COOKIE}=${resolved}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } catch {
        // ignore cookie errors
      }
      startTransition(() => {
        const nextPath = buildLocalizedPath(resolved);
        router.push(nextPath, { scroll: false });
        router.refresh();
      });
    },
    [buildLocalizedPath, fallbackForState, resolvedAvailable, router],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, defaultLanguage: defaultForPrefix, availableLanguages: resolvedAvailable, setLanguage, isChanging: isPending }),
    [language, defaultForPrefix, resolvedAvailable, setLanguage, isPending],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return ctx;
}
