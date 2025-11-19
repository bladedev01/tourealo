import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttractionDetailView } from "@/components/attractions/AttractionDetailView";
import { fetchAttractionBySlug, fetchAttractionTours } from "@/services/attractions";
import { getCachedSettings } from "@/services/settings-cache";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { normalizeLanguage } from "@/lib/language-shared";
import { getSiteOrigin } from "@/lib/env";
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
  // El backend ya entrega el slug canónico (con publicCode y prefijo si corresponde)
  return attraction.slug || fallbackSlug;
}


export async function generateMetadata({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ requestedLanguage: resolvedSearchParams.lang, availableLanguages, fallbackLanguage });

  try {
    const attraction = await fetchAttractionBySlug(resolvedParams.slug, { lang: language });
    if (!attraction) {
      return DEFAULT_METADATA;
    }
    const translation = selectTranslation(attraction, language, fallbackLanguage);
    const brand = settings.appName || "Tourealo";
    const rawName = translation?.name || attraction.slug || brand;
    const locationName = attraction.parentLocation?.name;
    const metaName = locationName ? `${rawName} en ${locationName}` : rawName;
    const metaTitle = `${metaName} | ${brand}`;

    // Build description: prefer translated shortDescription but ensure it mentions the location
    let description = translation?.shortDescription ?? `Descubre ${rawName}${locationName ? ` en ${locationName}` : ""}. Explora tours y actividades relacionadas, con cancelación flexible y proveedores verificados en ${brand}.`;
    if (translation?.shortDescription && locationName && !translation.shortDescription.includes(locationName)) {
      description = `${translation.shortDescription.replace(/\.?\s*$/, '')} en ${locationName}.`;
    }

    const canonicalSlug = buildCanonicalSlug(attraction, translation, resolvedParams.slug);
    const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;
    const canonicalUrl = `${getSiteOrigin()}${prefix}/attractions/${canonicalSlug}`;

    return {
      title: metaTitle,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: metaTitle,
        description,
        type: "website",
        url: canonicalUrl,
      },
      twitter: {
        title: metaTitle,
        description,
        card: "summary_large_image",
      },
    } satisfies Metadata;
  } catch (error) {
    console.warn("Failed to generate attraction metadata", error);
    return DEFAULT_METADATA;
  }
}



export default async function AttractionPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ requestedLanguage: resolvedSearchParams.lang, availableLanguages, fallbackLanguage });
  const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;

  let attraction: Attraction | null = null;
  try {
    attraction = await fetchAttractionBySlug(resolvedParams.slug, { lang: language });
  } catch (error) {
    console.warn("Failed to load attraction", error);
  }

  if (!attraction || !attraction.id) {
    notFound();
  }

  // Construir slug canónico: [slug]-[publicCode] usando la traducción principal
  const translation = selectTranslation(attraction, language, fallbackLanguage);
  const canonicalSlug = `${translation?.slug || attraction.slug}-${attraction.publicCode}`;
  const requestedSlug = decodeURIComponent(resolvedParams.slug);
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
    <>
      {/* Language sync removed: global language handling is done by LanguageProvider */}
      <AttractionDetailView
        attraction={attraction}
        translation={translation}
        tours={tours}
        language={language}
        prefix={prefix}
        brandName={brandName}
      />
    </>
  );
}
