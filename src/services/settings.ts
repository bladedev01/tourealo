import { apiFetch } from "@/lib/http";
import type { Settings } from "@/types/settings";

export async function fetchSettings() {
  const data = await apiFetch<Settings>("/settings", { isServer: true, cacheTag: "settings" });
  return {
    ...data,
    availableLanguages: data.availableLanguages || [],
    availableCurrencies: data.availableCurrencies || [],
  } satisfies Settings;
}
