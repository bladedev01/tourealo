import Link from "next/link";
import Image from "next/image";
import { LocationCard } from "@/components/locations/LocationCard";
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { FeaturedTours } from "@/components/home/FeaturedTours";
import PopularTours from "@/components/home/PopularTours";
import { FeaturedLocations } from "@/components/home/FeaturedLocations";
import { fetchTours } from "@/services/tours";
import { fetchLocationsList } from "@/services/locations";
import { PopularTabs } from "@/components/home/PopularTabs";
import type { Category } from "@/types/category";
import type { Destination } from "@/types/destination";
import type { Country } from "@/types/country";
import { fetchSearchSuggestions } from "@/services/search";
import { fetchAttractionsList } from "@/services/attractions";
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
  const { data: popularTours } = await fetchTours(
    {
      orderBy: "bookings_count",
      orderDir: "DESC",
      pageSize: 8,
      lang: language,
    },
    { cacheTag: "home:popular" },
  );
  const { data: locations } = await fetchLocationsList({ lang: language });
  // También pedir sugerencias genéricas para obtener `countActivities` por ubicación/categoría
  const suggestAll = await fetchSearchSuggestions({ query: "a", lang: language, limit: 50 });
  const suggestLocations = suggestAll.locations || [];

  // Obtener países y destinos desde locations
  const countriesTab = (locations || [])
    .filter((loc) => loc.type === "country")
      .map((loc) => ({
      slug: loc.slug ?? "",
      name: loc.name ?? "",
      // Preferir countActivities devuelto por search suggestions (más fiable)
      count:
        Number(
          (suggestLocations.find((s) => (s.slug && s.slug === loc.slug) || (s.publicCode && s.publicCode === (loc as any).publicCode))?.countActivities) ??
            (loc as any).countActivities ??
            0,
        ) || 0,
      href: loc.slug ? `/${loc.slug}` : "#",
    }));
  const destinationsTab = (locations || [])
    .filter((loc) => loc.type === "city" || loc.type === "destination")
    .map((loc) => ({
      slug: loc.slug ?? "",
      name: loc.name ?? "",
      count:
        Number(
          (suggestLocations.find((s) => (s.slug && s.slug === loc.slug) || (s.publicCode && s.publicCode === (loc as any).publicCode))?.countActivities) ??
            (loc as any).countActivities ??
            0,
        ) || 0,
      href: loc.slug ? `/${loc.slug}` : "#",
    }));

  // Atracciones reales desde el endpoint profesional
  const { data: attractions = [] } = await fetchAttractionsList({ lang: language, pageSize: 10 });
  const attractionsTab = attractions.map((attr) => ({
    slug: attr.slug || String(attr.id),
    name: attr.translations?.[0]?.name || attr.slug || String(attr.id),
    count: (attr as any).count || 0,
    href: attr.slug && attr.publicCode ? `/attractions/${attr.slug}-${attr.publicCode}` : "#",
    publicCode: attr.publicCode,
  }));

  // Categorías reales desde /search/suggest (usando query genérica)
  const suggest = await fetchSearchSuggestions({ query: "a", lang: language, limit: 10 });
  const categoriesTab = (suggest.categories || []).map((cat) => ({
    slug: cat.slug || String(cat.id),
    name: cat.name,
    count: cat.countActivities || 0,
    href: `/categories/${cat.slug}`,
  }));
  return (
    <div>
      <Hero />
      <section className="bg-white py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4">
          <FeaturedTours tours={tours} language={language} />
          <PopularTours tours={popularTours} language={language} />
        </div>
      </section>
      {locations && locations.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto w-full max-w-7xl px-4">
            <FeaturedLocations locations={locations} hrefPrefix={prefix} />
          </div>
        </section>
      )}
      <section className="bg-slate-50 py-8">
        <div className="mx-auto w-full max-w-7xl px-4">
          <PopularTabs
            attractions={attractionsTab}
            destinations={destinationsTab}
            countries={countriesTab}
            categories={categoriesTab}
          />
        </div>
      </section>
      <ValueProps />
    </div>
  );
}
