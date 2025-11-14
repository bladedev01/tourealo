import { apiFetch } from "@/lib/http";
import type { TranslationNamespace } from "@/lib/i18n/config";

export type NamespaceDictionary = Record<string, string>;
export type NamespaceBundle = Record<string, NamespaceDictionary>;

export async function fetchNamespace(
  language: string,
  namespace: string,
  defaults?: Record<string, string>,
): Promise<NamespaceDictionary> {
  const query = new URLSearchParams();
  if (defaults && Object.keys(defaults).length > 0) {
    try {
      query.set("defaults", JSON.stringify(defaults));
    } catch {
      // ignore serialization issues
    }
  }
  const qs = query.toString();
  const path = qs ? `/i18n/${language}/${namespace}?${qs}` : `/i18n/${language}/${namespace}`;
  try {
    return await apiFetch<NamespaceDictionary>(path, { isServer: typeof window === "undefined" });
  } catch {
    return {};
  }
}

export async function fetchNamespaces(
  language: string,
  namespaces: string[],
  defaults?: Record<string, Record<string, string>>,
): Promise<NamespaceBundle> {
  const entries = await Promise.all(
    namespaces.map(async (ns) => {
      const dictionary = await fetchNamespace(language, ns, defaults?.[ns]);
      return [ns, dictionary] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function fetchKnownNamespace(
  language: string,
  namespace: TranslationNamespace,
  defaults?: Record<string, string>,
) {
  return fetchNamespace(language, namespace, defaults);
}
