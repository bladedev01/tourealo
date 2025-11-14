"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { LanguageCode } from "@/lib/language-shared";
import type { NamespaceBundle } from "@/services/i18n";
import { fetchNamespace } from "@/services/i18n";

export type TranslationContextValue = {
  language: LanguageCode;
  namespaces: NamespaceBundle;
  loadNamespace: (namespace: string, defaults?: Record<string, string>) => Promise<void>;
  addPendingDefaults: (namespace: string, defaults: Record<string, string>) => void;
};

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);
TranslationContext.displayName = "TranslationContext";

export function TranslationProvider({
  language,
  initialNamespaces,
  children,
}: {
  language: LanguageCode;
  initialNamespaces: NamespaceBundle;
  children: React.ReactNode;
}) {
  const [namespaces, setNamespaces] = useState<NamespaceBundle>(initialNamespaces);
  const namespacesRef = useRef(namespaces);
  const pending = useRef(new Map<string, Promise<void>>());
  // Buffer to accumulate default keys requested before the namespace is fetched
  const pendingDefaults = useRef<Record<string, Record<string, string>>>({});

  useEffect(() => {
    namespacesRef.current = namespaces;
  }, [namespaces]);

  // Control de montaje global para evitar updates en componentes desmontados
  // Start as false; set to true in effect. This prevents updates that happen
  // before the component mounts (which can trigger React warnings).
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadNamespace = useCallback(
    async (namespace: string, defaults?: Record<string, string>) => {
      if (namespacesRef.current[namespace]) return;
      const existing = pending.current.get(namespace);
      if (existing) return existing;

      // Merge defaults with any pending defaults collected via addPendingDefaults
      const buffered = pendingDefaults.current[namespace] || {};
      const mergedDefaults = { ...(defaults || {}), ...buffered };
      // Clear buffer now that we're starting the request
      delete pendingDefaults.current[namespace];

      const request = fetchNamespace(language, namespace, Object.keys(mergedDefaults).length ? mergedDefaults : undefined)
        .then((dictionary) => {
          if (isMountedRef.current) {
            setNamespaces((prev) => {
              if (prev[namespace]) return prev;
              const next = { ...prev, [namespace]: dictionary };
              return next;
            });
          }
        })
        .finally(() => {
          pending.current.delete(namespace);
        });
      pending.current.set(namespace, request);
      return request;
    },
    [language],
  );

  const addPendingDefaults = useCallback((namespace: string, defaults: Record<string, string>) => {
    if (!defaults || Object.keys(defaults).length === 0) return;
    const current = pendingDefaults.current[namespace] || {};
    pendingDefaults.current[namespace] = { ...current, ...defaults };
  }, []);

  const value = useMemo<TranslationContextValue>(
    () => ({ language, namespaces, loadNamespace, addPendingDefaults }),
    [language, namespaces, loadNamespace, addPendingDefaults],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslationContext() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslationContext must be used within a TranslationProvider");
  }
  return ctx;
}
