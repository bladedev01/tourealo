import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttractionDetailView } from "@/components/attractions/AttractionDetailView";
import { fetchAttractionBySlug, fetchAttractionTours } from "@/services/attractions";
import { getCachedSettings } from "@/services/settings-cache";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { normalizeLanguage } from "@/lib/language-shared";
import type { Attraction, AttractionTranslation } from "@/types/attraction";
import type { Tour } from "@/types/tour";
import type { Settings } from "@/types/settings";

const DEFAULT_METADATA: Metadata = {
  title: "Atracción | Tourealo",
  description: "Descubre atracciones memorables y reserva actividades seleccionadas por Tourealo.",
};

type PageProps = {
  params: { slug: string };
  searchParams: { lang?: string };
};

function selectTranslation(attraction: Attraction, language: string, fallbackLanguage: string): AttractionTranslation | null {
  const translations = Array.isArray(attraction.translations) ? attraction.translations : null;
  if (!translations || translations.length === 0) {
    return null;
  }
  const exact = translations.find((item) => item?.lang === language);
  if (exact) return exact;
  const fallback = translations.find((item) => item?.lang === fallbackLanguage);
  if (fallback) return fallback;
  return translations[0] ?? null;
}

function buildCanonicalSlug(attraction: Attraction, translation: AttractionTranslation | null, fallbackSlug: string): string {
  const base = translation?.slug || attraction.slug || fallbackSlug;
  if (!base) return fallbackSlug;
  if (attraction.publicCode) {
    return `${base}-a${attraction.publicCode}`;
  }
  return base;
}

function getSiteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://tourealo.dev";
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ requestedLanguage: searchParams.lang, availableLanguages, fallbackLanguage });

  try {
    const attraction = await fetchAttractionBySlug(params.slug, { lang: language });
    if (!attraction) {
      return DEFAULT_METADATA;
    }
    const translation = selectTranslation(attraction, language, fallbackLanguage);
    const brand = settings.appName || "Tourealo";
    const title = translation?.name || attraction.slug || brand;
    const description = translation?.shortDescription || `Explora ${title} con experiencias curadas por ${brand}.`;
    const canonicalSlug = buildCanonicalSlug(attraction, translation, params.slug);
    const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;
    const canonicalUrl = `${getSiteOrigin()}${prefix}/attractions/${canonicalSlug}`;

    return {
      title: `${title} | ${brand}`,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${title} | ${brand}`,
        description,
        type: "website",
        url: canonicalUrl,
      },
      twitter: {
        title: `${title} | ${brand}`,
        description,
        card: "summary_large_image",
      },
    } satisfies Metadata;
  } catch (error) {
    console.warn("Failed to generate attraction metadata", error);
    return DEFAULT_METADATA;
  }
}

export default async function AttractionPage({ params, searchParams }: PageProps) {
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ requestedLanguage: searchParams.lang, availableLanguages, fallbackLanguage });
  const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;

  let attraction: Attraction | null = null;
  try {
    attraction = await fetchAttractionBySlug(params.slug, { lang: language });
  } catch (error) {
    console.warn("Failed to load attraction", error);
  }

  if (!attraction || !attraction.id) {
    notFound();
  }

  const translation = selectTranslation(attraction, language, fallbackLanguage);
  const canonicalSlug = buildCanonicalSlug(attraction, translation, params.slug);
  const requestedSlug = decodeURIComponent(params.slug);
  if (canonicalSlug && canonicalSlug.toLowerCase() !== requestedSlug.toLowerCase()) {
    redirect(`${prefix}/attractions/${canonicalSlug}`);
  }

  let tours: Tour[] = [];
  try {
    const tourResponse = await fetchAttractionTours(attraction.id, { lang: language });
    const data = (tourResponse as any)?.data;
    if (Array.isArray(data)) {
      tours = data as Tour[];
    } else if (Array.isArray(tourResponse)) {
      tours = tourResponse as unknown as Tour[];
    }
  } catch (error) {
    console.warn("Failed to load attraction tours", error);
  }

  const brandName = settings.appName || "Tourealo";

  return (
    <AttractionDetailView
      attraction={attraction}
      translation={translation}
      tours={tours}
      language={language}
      prefix={prefix}
      brandName={brandName}
    />
  );
}
