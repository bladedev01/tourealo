import { fetchTours } from "@/services/tours";
import { ToursGrid } from "@/components/tours/ToursGrid";
import { Pagination } from "@/components/tours/Pagination";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { getCachedSettings } from "@/services/settings-cache";
import { normalizeLanguage } from "@/lib/language-shared";
import type { Settings } from "@/types/settings";

const PAGE_SIZE = 12;

export default async function ToursPage({
  searchParams,
}: {
  searchParams: { page?: string; lang?: string };
}) {
  const page = Number(searchParams.page ?? 1) || 1;
  const settings = await getCachedSettings().catch<Settings>(() => ({
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ requestedLanguage: searchParams.lang, availableLanguages, fallbackLanguage });
  const langQueryParam = explicitDefaultLanguage && language === explicitDefaultLanguage ? undefined : language;

  let toursResponse;
  try {
    toursResponse = await fetchTours(
      { page, pageSize: PAGE_SIZE, orderBy: "createdAt", orderDir: "DESC", lang: language },
      { cacheTag: `tours:list:${page}:${language}` },
    );
  } catch (error) {
    console.error("Failed to load tours", error);
    toursResponse = { data: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  const totalPages = Math.max(1, Math.ceil(toursResponse.total / toursResponse.pageSize));

  return (
    <div className="bg-slate-50 py-16">
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Explora nuestros tours</h1>
            <p className="mt-2 text-slate-600">
              Encuentra experiencias únicas alrededor del mundo con confirmación inmediata y proveedores certificados.
            </p>
          </div>
        </header>
        <ToursGrid tours={toursResponse.data} language={language} />
        <Pagination page={page} totalPages={totalPages} language={language} defaultLanguage={explicitDefaultLanguage ?? ""} langQueryParam={langQueryParam} />
      </div>
    </div>
  );
}
