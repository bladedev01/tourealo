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
  let settings: Settings;
  try {
    settings = await getCachedSettings();
  } catch (err: any) {
    console.error("Home: failed to load settings:", err?.message || err);
    settings = { appName: "Tourealo", availableLanguages: [] } as Settings;
  }
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const defaultLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ availableLanguages, fallbackLanguage: defaultLanguage });
  const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;
  let tours: any[] = [];
  try {
    const res = await fetchTours(
      {
        orderBy: "popularity",
        orderDir: "DESC",
        pageSize: 9,
        lang: language,
      },
      { cacheTag: "home:tours" },
    );
    tours = res.data ?? [];
  } catch (err: any) {
    console.error("Home: fetchTours failed:", err?.message || err);
    throw new Error(`Home fetch failed: fetchTours -> ${err?.message || String(err)}`);
  }
  let popularTours: any[] = [];
  try {
    const popRes = await fetchTours(
      {
        orderBy: "bookings_count",
        orderDir: "DESC",
        pageSize: 8,
        lang: language,
      },
      { cacheTag: "home:popular" },
    );
    popularTours = popRes.data ?? [];
  } catch (err: any) {
    console.error("Home: fetchTours (popular) failed:", err?.message || err);
    throw new Error(`Home fetch failed: fetchPopularTours -> ${err?.message || String(err)}`);
  }
  let locations: any[] = [];
  try {
    const locRes = await fetchLocationsList({ lang: language });
    locations = locRes.data ?? [];
  } catch (err: any) {
    console.error("Home: fetchLocationsList failed:", err?.message || err);
    throw new Error(`Home fetch failed: fetchLocationsList -> ${err?.message || String(err)}`);
  }
  // También pedir sugerencias genéricas para obtener `countActivities` por ubicación/categoría
  let suggestAll: any = { locations: [], categories: [] };
  try {
    suggestAll = await fetchSearchSuggestions({ query: "a", lang: language, limit: 50 });
  } catch (err: any) {
    console.error("Home: fetchSearchSuggestions failed:", err?.message || err);
    throw new Error(`Home fetch failed: fetchSearchSuggestions -> ${err?.message || String(err)}`);
  }
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
          (suggestLocations.find((s: any) => (s.slug && s.slug === loc.slug) || (s.publicCode && s.publicCode === (loc as any).publicCode))?.countActivities) ??
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
          (suggestLocations.find((s: any) => (s.slug && s.slug === loc.slug) || (s.publicCode && s.publicCode === (loc as any).publicCode))?.countActivities) ??
            (loc as any).countActivities ??
            0,
        ) || 0,
      href: loc.slug ? `/${loc.slug}` : "#",
    }));

  // Atracciones reales desde el endpoint profesional
  let attractions: any[] = [];
  try {
    const atRes = await fetchAttractionsList({ lang: language, pageSize: 10 });
    attractions = atRes.data ?? [];
  } catch (err: any) {
    console.error("Home: fetchAttractionsList failed:", err?.message || err);
    // non-fatal: continue with empty attractions
    attractions = [];
  }
  const attractionsTab = attractions.map((attr) => ({
    slug: attr.slug || String(attr.id),
    name: attr.translations?.[0]?.name || attr.slug || String(attr.id),
    count: (attr as any).count || 0,
    href: attr.slug && attr.publicCode ? `/attractions/${attr.slug}-${attr.publicCode}` : "#",
    publicCode: attr.publicCode,
  }));

  // Categorías reales desde /search/suggest (usando query genérica)
  let suggest: any = { categories: [] };
  try {
    suggest = await fetchSearchSuggestions({ query: "a", lang: language, limit: 10 });
  } catch (err: any) {
    console.error("Home: fetchSearchSuggestions (categories) failed:", err?.message || err);
    suggest = { categories: [] };
  }
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
