import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LocationDetailView } from "@/components/locations/LocationDetailView";
import { fetchLocationBySlug, fetchLocationTours } from "@/services/locations";
import { getCachedSettings } from "@/services/settings-cache";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { normalizeLanguage } from "@/lib/language-shared";
import type { Location } from "@/types/location";
import type { Tour } from "@/types/tour";
import type { Settings } from "@/types/settings";

const DEFAULT_METADATA: Metadata = {
  title: "Destinos | Tourealo",
  description: "Encuentra las mejores actividades y tours en tus destinos favoritos con Tourealo.",
};

type PageProps = {
  params: { slug: string };
  searchParams: { lang?: string };
};

function normalizeSlugCandidate(slug: string | undefined | null) {
  if (typeof slug !== "string") return "";
  return slug.replace(/-L([A-Za-z0-9]+)$/g, "-l$1");
}

function buildCanonicalSlug(location: Location, fallbackSlug: string) {
  if (location.slug && location.publicCode) {
    return `${location.slug}-l${location.publicCode}`;
  }
  return location.slug || fallbackSlug;
}

function parseLocationName(location: Location, fallbackSlug: string) {
  if (location.name && location.name.trim().length > 0) {
    return location.name;
  }
  return fallbackSlug.replace(/-l[A-Za-z0-9]+$/, "").replace(/-/g, " ").replace(/\s+/g, " ").trim();
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

  const normalizedSlug = normalizeSlugCandidate(params.slug);

  try {
    const location = await fetchLocationBySlug(normalizedSlug);
    if (!location) {
      return DEFAULT_METADATA;
    }
    const brand = settings.appName || "Tourealo";
    const name = parseLocationName(location, normalizedSlug);
    const year = new Date().getFullYear();
    const canonicalSlug = buildCanonicalSlug(location, normalizedSlug);
    const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;
    const canonicalUrl = `${getSiteOrigin()}${prefix}/locations/${canonicalSlug}`;

    const title = `Qué hacer en ${name} en ${year} | ${brand}`;
    const description = `Descubre tours y actividades en ${name}. Cancelación flexible, proveedores verificados y precios exclusivos en ${brand}.`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "website",
      },
      twitter: {
        title,
        description,
        card: "summary_large_image",
      },
    } satisfies Metadata;
  } catch (error) {
    console.warn("Failed to generate location metadata", error);
    return DEFAULT_METADATA;
  }
}

export default async function LocationPage({ params, searchParams }: PageProps) {
  // Redirect /locations/[slug] to /[slug] for canonical city URLs
  if (params?.slug) {
    return redirect(`/${params.slug}`);
  }
  const settings = await getCachedSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ requestedLanguage: searchParams.lang, availableLanguages, fallbackLanguage });
  const prefix = explicitDefaultLanguage && language === explicitDefaultLanguage ? "" : `/${language}`;

  const normalizedSlug = normalizeSlugCandidate(params.slug);
  if (normalizedSlug !== params.slug) {
    redirect(`${prefix}/locations/${normalizedSlug}`);
  }

  let location: Location | null = null;
  try {
    location = await fetchLocationBySlug(normalizedSlug);
  } catch (error) {
    console.warn("Failed to load location", error);
  }

  if (!location || !location.id) {
    notFound();
  }

  const canonicalSlug = buildCanonicalSlug(location, normalizedSlug);
  if (canonicalSlug && canonicalSlug.toLowerCase() !== normalizedSlug.toLowerCase()) {
    redirect(`${prefix}/locations/${canonicalSlug}`);
  }

  let tours: Tour[] = [];
  try {
    const response = await fetchLocationTours(normalizedSlug, { lang: language });
    const data = (response as any)?.data;
    if (Array.isArray(data)) {
      tours = data as Tour[];
    } else if (Array.isArray(response)) {
      tours = response as unknown as Tour[];
    }
  } catch (error) {
    console.warn("Failed to load location tours", error);
  }

  return <LocationDetailView location={location} tours={tours} language={language} />;
}
