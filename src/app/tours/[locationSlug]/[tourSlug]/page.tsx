import { notFound } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import TourGallery from "@/components/tour/TourGallery";
import TourBookingSection from "@/components/tour/TourBookingSection";
import TourReviews from "@/components/tour/TourReviews";
import { MapPin, Timer, BadgePercent, DollarSign, Sparkles, Check, X } from "lucide-react";
import Link from "next/link";
import { fetchTourDetail } from "@/services/tours";
import type { Metadata } from "next";
import type { TourDetail } from "@/types/tour";
import { Button } from "@/components/ui/Button";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { normalizeLanguage } from "@/lib/language-shared";
import { getCachedSettings } from "@/services/settings-cache";
import type { Settings } from "@/types/settings";

function pickValue(map: Record<string, string> | undefined, language: string, fallbackLang = "en") {
  if (!map) return "";
  return map[language] || map[fallbackLang] || map[Object.keys(map)[0] as keyof typeof map] || "";
}

function buildGallery(tour: TourDetail) {
  const fromMedia = Array.isArray(tour.media) ? tour.media.map((item) => item.url).filter(Boolean) : [];
  const fromGallery = Array.isArray(tour.gallery) ? tour.gallery : [];
  return [tour.coverImageUrl, ...fromMedia, ...fromGallery].filter((value): value is string => Boolean(value));
}

type PageParams = {
  params: { locationSlug: string; tourSlug: string };
  searchParams: { lang?: string };
};

async function loadTour(locationSlug: string, tourSlug: string, lang: string) {
  try {
    return await fetchTourDetail({ locationSlug, titleSlug: tourSlug, lang });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("404")) {
      notFound();
    }
    throw error;
  }
}

async function resolveLanguageOptions(requestedLanguage?: string) {
  const settings = await getCachedSettings().catch<Settings>(() => ({
    availableLanguages: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const language = await detectLanguage({ requestedLanguage, availableLanguages, fallbackLanguage });
  return { language, defaultLanguage: explicitDefaultLanguage ?? "" };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { language: lang } = await resolveLanguageOptions(resolvedSearchParams.lang);
  let tour: TourDetail | null = null;
  try {
    tour = await fetchTourDetail({ locationSlug: resolvedParams.locationSlug, titleSlug: resolvedParams.tourSlug, lang });
  } catch {
    return {
      title: "Tour no encontrado",
    };
  }
  const translations = (tour.translations ?? {}) as Record<string, Record<string, string>>;
  const title = pickValue(translations.name, lang) || tour.name || tour.title || "Detalle del tour";
  const description = pickValue(translations.shortDescription, lang) || tour.shortDescription || tour.description || "Explora esta experiencia";
  const image = buildGallery(tour)[0];
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function TourDetailPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { language: lang, defaultLanguage } = await resolveLanguageOptions(resolvedSearchParams.lang);
  const prefix = defaultLanguage && lang === defaultLanguage ? "" : `/${lang}`;
  const tour = await loadTour(resolvedParams.locationSlug, resolvedParams.tourSlug, lang);
  const translations = (tour.translations ?? {}) as Record<string, Record<string, string>>;
  const title = pickValue(translations.name, lang) || tour.name || tour.title || "";
  const shortDescription = pickValue(translations.shortDescription, lang) || tour.shortDescription || "";
  const longDescription = pickValue(translations.longDescription, lang) || tour.longDescription || tour.description || "";
  const highlightsRaw = pickValue(translations.highlights, lang);
  const includedRaw = pickValue(translations.included, lang);
  const notIncludedRaw = pickValue(translations.notIncluded, lang);
  const gallery = buildGallery(tour);
  const locationName = Array.isArray(tour.locations) && tour.locations.length
    ? tour.locations.find((loc) => loc.type === "city")?.name || tour.locations[0]?.name
    : tour.location?.name;

  const currency = (tour.currency || "USD").toUpperCase();
  const basePrice = Number(tour.basePrice ?? tour.price ?? 0);
  const priceLabel = basePrice > 0 ? `${basePrice.toLocaleString(lang)} ${currency}` : null;
  const durationLabel = typeof tour.duration === "string" ? tour.duration : tour.duration ? `${tour.duration} min` : null;

  const cancellation = tour.cancellationPolicy;
  const cancellationLabel = cancellation?.summary || cancellation?.shortMessage || cancellation?.title;

  const highlights = highlightsRaw ? highlightsRaw.split(/\r?\n/).filter(Boolean) : [];
  const included = includedRaw ? includedRaw.split(/\r?\n/).filter(Boolean) : [];
  const notIncluded = notIncludedRaw ? notIncludedRaw.split(/\r?\n/).filter(Boolean) : [];

  return (
    <div className="bg-white pb-20">
      <div className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <p className="text-sm uppercase tracking-wider text-emerald-600">Tour destacado</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
              {shortDescription && (
                <p className="mt-4 text-lg text-slate-600">{shortDescription}</p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {locationName && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-500" /> {locationName}</span>
                )}
                {durationLabel && (
                  <span className="flex items-center gap-1"><Timer className="w-4 h-4 text-emerald-500" /> {durationLabel}</span>
                )}
                {tour.supplier?.company_name && (
                  <span className="flex items-center gap-1"><BadgePercent className="w-4 h-4 text-emerald-500" /> Proveedor: {tour.supplier.company_name}</span>
                )}
                {priceLabel && (
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-500" /> Desde {priceLabel}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button href={prefix ? `${prefix}/book/${tour.publicCode ?? tour.id}` : `/book/${tour.publicCode ?? tour.id}`} variant="primary">
                Reservar ahora
              </Button>
              <Button href={prefix ? `${prefix}/tours` : "/tours"} variant="ghost">
                Volver a tours
              </Button>
            </div>
          </div>
          {gallery.length > 0 && (
            <TourGallery images={gallery} />
          )}
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="flex flex-col-reverse gap-12 lg:flex-row lg:items-start">
          {/* Columna principal izquierda */}
          <div className="flex-1 min-w-0">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">Descripción</h2>
              {longDescription ? (
                <p className="whitespace-pre-line text-slate-700">{longDescription}</p>
              ) : (
                <p className="text-slate-500">No hay descripción disponible para este tour.</p>
              )}
            </section>
            {highlights.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900">Lo que más gusta</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                      <span className="mt-1"><Sparkles className="w-4 h-4" /></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(included.length > 0 || notIncluded.length > 0) && (
              <section className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-slate-900">Incluye</h2>
                  {included.length > 0 ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {included.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-0.5 text-emerald-500"><Check className="w-4 h-4" /></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">Sin detalles proporcionados.</p>
                  )}
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-slate-900">No incluye</h2>
                  {notIncluded.length > 0 ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {notIncluded.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-0.5 text-rose-500"><X className="w-4 h-4" /></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">No hay elementos excluidos indicados.</p>
                  )}
                </div>
              </section>
            )}
            {cancellationLabel && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900">Política de cancelación</h2>
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {cancellationLabel}
                </p>
                {cancellation?.legalText && (
                  <details className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <summary className="cursor-pointer font-semibold text-slate-900">Ver texto legal completo</summary>
                    <p className="mt-3 whitespace-pre-line text-slate-600">{cancellation.legalText}</p>
                  </details>
                )}
              </section>
            )}
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Reseñas</h2>
              <TourReviews
                reviews={Array.isArray(tour.reviews)
                  ? tour.reviews.map((r: any) => ({
                      user: r.user?.name || r.user?.username || r.user || "Anónimo",
                      rating: typeof r.rating === "number" ? r.rating : 5,
                      comment: r.comment || r.text || "",
                    }))
                  : []}
              />
            </section>
            <div className="text-center text-sm text-slate-500 mt-8">
              ¿Quieres ver más opciones? <Link href={prefix ? `${prefix}/tours` : "/tours"} className="font-semibold text-emerald-600">Explora todos nuestros tours</Link>.
            </div>
          </div>
          {/* Columna derecha: formulario sticky */}
          <aside className="w-full lg:w-[380px] flex-shrink-0 mb-8 lg:mb-0 lg:pl-8">
            <div className="lg:sticky lg:top-28">
              <TourBookingSection
                price={basePrice}
                currency={currency}
                isAvailable={!!basePrice}
                contactHref={prefix ? `${prefix}/contacto` : "/contacto"}
                tourId={tour.id}
                groupMin={tour.minGroupSize || 1}
                groupMax={tour.maxGroupSize || tour.groupSize || 20}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
