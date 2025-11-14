import Link from "next/link";
import Image from "next/image";
import { LocationCard } from "@/components/locations/LocationCard";
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { FeaturedTours } from "@/components/home/FeaturedTours";
import { fetchTours } from "@/services/tours";
import { fetchLocationsList } from "@/services/locations";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { normalizeLanguage } from "@/lib/language-shared";
import { getCachedSettings } from "@/services/settings-cache";
import type { Settings } from "@/types/settings";

export default async function Home() {
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const defaultLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ availableLanguages, fallbackLanguage: defaultLanguage });
  const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;
  const { data: tours } = await fetchTours(
    {
      orderBy: "popularity",
      orderDir: "DESC",
      pageSize: 9,
      lang: language,
    },
    { cacheTag: "home:tours" },
  );
  const { data: locations } = await fetchLocationsList({ lang: language });

  return (
    <div>
      <Hero />
      <section className="bg-white py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tours populares</h2>
              <p className="mt-2 text-slate-600">
                Reservas con confirmación inmediata y opciones de cancelación flexible.
              </p>
            </div>
            <Link
              href={prefix ? `${prefix}/tours` : "/tours"}
              className="text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-500"
            >
              Ver todos los tours →
            </Link>
          </div>
          <FeaturedTours tours={tours} language={language} />
        </div>
      </section>
      {locations && locations.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto w-full max-w-7xl px-4">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Destinos populares</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
              {locations.slice(0, 12).map((loc) => (
                <LocationCard key={loc.id} location={loc} hrefPrefix={prefix} />
              ))}
            </div>
          </div>
        </section>
      )}
      <ValueProps />
    </div>
  );
}
