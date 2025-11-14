import { VerifyVoucherView } from "@/components/vouchers/VerifyVoucherView";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { getCachedSettings } from "@/services/settings-cache";
import type { Settings } from "@/types/settings";

export default async function VerifyVoucherPage({ params, searchParams }: { params: { code: string }; searchParams: { lang?: string } }) {
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  await detectLanguage({ requestedLanguage: searchParams.lang, availableLanguages, fallbackLanguage });
  return <VerifyVoucherView code={decodeURIComponent(params.code)} />;
}
