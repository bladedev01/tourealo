"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useTranslationContext } from "@/providers/TranslationProvider";

export function useTranslation(namespace: string, defaults?: Record<string, string>) {
  const { language, namespaces, loadNamespace, addPendingDefaults } = useTranslationContext();
  const dictionary = namespaces[namespace];

  useEffect(() => {
    if (!dictionary) {
      loadNamespace(namespace, defaults).catch(() => {
        // Si la carga falla, devolvemos los textos por defecto.
      });
    }
  }, [namespace, dictionary, defaults, loadNamespace]);

  const t = useCallback(
    (key: string, fallback?: string) => {
      if (dictionary && key in dictionary) {
        return dictionary[key];
      }
      // If the namespace hasn't loaded yet, request it and include this key as a default
      if (!dictionary) {
        // include a minimal defaults payload so the backend receives the key and fallback text
        const defaultsForKey: Record<string, string> = { [key]: fallback ?? key };
        // Add to pending defaults buffer so multiple keys requested before fetch are sent together
        try {
          addPendingDefaults(namespace, defaultsForKey);
        } catch (err) {
          void err;
        }
        // Fire-and-forget: loadNamespace will dedupe concurrent requests
        loadNamespace(namespace).catch(() => {});
        // helpful debug for tracing
        console.debug('[useTranslation] buffered default key and triggered loadNamespace', { namespace, key, fallback });
      }
      return fallback ?? key;
    },
    [dictionary, loadNamespace, namespace, addPendingDefaults],
  );

  return useMemo(
    () => ({ t, language, ready: Boolean(dictionary) }),
    [t, language, dictionary],
  );
}
