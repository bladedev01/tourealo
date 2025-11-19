import { VoucherView } from "@/components/vouchers/VoucherView";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { getCachedSettings } from "@/services/settings-cache";
import type { Settings } from "@/types/settings";

import { notFound } from "next/navigation";

export default async function VoucherPage(props: any) {
  const params = props.params && typeof props.params.then === "function" ? await props.params : props.params;
  const searchParams = props.searchParams && typeof props.searchParams.then === "function" ? await props.searchParams : props.searchParams;
  if (!params?.code || typeof params.code !== "string" || params.code.trim() === "" || params.code === "undefined") {
    return notFound();
  }
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  await detectLanguage({ requestedLanguage: searchParams?.lang, availableLanguages, fallbackLanguage });

  return <VoucherView code={decodeURIComponent(params.code)} />;
}
