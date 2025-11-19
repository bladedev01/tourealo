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
import { getSiteOrigin } from "@/lib/env";

const DEFAULT_METADATA: Metadata = {
	title: "Destinos | Tourealo",
	description: "Encuentra las mejores actividades y tours en tus destinos favoritos con Tourealo.",
};

type PageProps = {
	params: { slug: string } | Promise<{ slug: string }>;
	searchParams: { lang?: string } | Promise<{ lang?: string }>;
};

function normalizeSlugCandidate(slug: string | undefined | null) {
	if (typeof slug !== "string") return "";
	return slug;
}

function buildCanonicalSlug(location: Location, fallbackSlug: string) {
	// El backend es la única fuente de verdad para el slug
	return location.slug || fallbackSlug;
}

function parseLocationName(location: Location, fallbackSlug: string) {
	if (location.name && location.name.trim().length > 0) {
		return location.name;
	}
	// Solo convierte el slug a texto legible, sin quitar sufijos especiales
	return fallbackSlug.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}


export async function generateMetadata(props: PageProps): Promise<Metadata> {
	const params = await props.params;
	const searchParams = await props.searchParams;
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
		const canonicalUrl = `${getSiteOrigin()}${prefix}/${canonicalSlug}`;

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

export default async function LocationPage(props: PageProps) {
	const params = await props.params;
	const searchParams = await props.searchParams;
	// Redirect /locations/[slug] to /[slug] for canonical city URLs
	if (params?.slug && params.slug.startsWith("locations/")) {
		return redirect(`/${params.slug.replace(/^locations\//, "")}`);
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

	// Usar el slug tal como viene del backend, sin manipular ni construir con prefijos
	const slugParam = params.slug;
	let location: Location | null = null;
	try {
		location = await fetchLocationBySlug(slugParam);
	} catch (error) {
		console.warn("Failed to load location", error);
	}

	if (!location || !location.id) {
		notFound();
	}

	// Construir slug canónico: [slug]-[publicCode]
	const canonicalSlug = `${location.slug}-${location.publicCode}`;
	if (canonicalSlug.toLowerCase() !== slugParam.toLowerCase()) {
		redirect(`${prefix}/${canonicalSlug}`);
	}

	let tours: Tour[] = [];
	try {
		const response = await fetchLocationTours(canonicalSlug, { lang: language });
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
