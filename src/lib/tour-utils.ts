import type { Tour, LocationRef, TourTranslation } from "@/types/tour";

type TranslationMap = {
  title: Record<string, string>;
  description: Record<string, string>;
  slug: Record<string, string>;
  shortDescription: Record<string, string>;
  name?: Record<string, string>;
};

export function mapTranslationsArrayToObject(translationsArr: TourTranslation[] = []): TranslationMap {
  const result: TranslationMap = {
    title: {},
    description: {},
    slug: {},
    shortDescription: {},
    name: {},
  };
  translationsArr.forEach((tr) => {
    if (!tr?.lang) return;
    if (tr.title) result.title[tr.lang] = tr.title;
    if (tr.description) result.description[tr.lang] = tr.description;
    if (tr.slug) result.slug[tr.lang] = tr.slug;
    if (tr.shortDescription) result.shortDescription[tr.lang] = tr.shortDescription;
    if (tr.name) result.name![tr.lang] = tr.name;
  });
  return result;
}

function getLocaleValue(value: unknown, language: string) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const map = value as Record<string, string>;
    if (map[language]) return map[language];
    if (map.en) return map.en;
    const keys = Object.keys(map);
    if (keys.length > 0) return map[keys[0]];
  }
  return "";
}

function pickLocation(tour: Tour) {
  if (Array.isArray(tour.locations) && tour.locations.length) {
    const city = tour.locations.find((loc: LocationRef) => loc.type === "city");
    const country = tour.locations.find((loc: LocationRef) => loc.type === "country");
    const base = city || tour.locations[0];
    return { city, country, base };
  }
  return { city: undefined, country: undefined, base: tour.location };
}

export function buildTourDisplay(tour: Tour, language: string) {
  const translationMap = Array.isArray(tour.translations)
    ? mapTranslationsArrayToObject(tour.translations)
    : (tour.translations as Record<string, Record<string, string>> | undefined);

  const title =
    getLocaleValue(translationMap?.title, language) ||
    getLocaleValue((translationMap as Record<string, Record<string, string>> | undefined)?.name, language) ||
    tour.name ||
    tour.title ||
    "";

  const shortDescription =
    getLocaleValue(translationMap?.shortDescription, language) ||
    getLocaleValue(translationMap?.description, language) ||
    tour.shortDescription ||
    "";

  const { city, country, base } = pickLocation(tour);
  const locationSlugRaw = base?.slug || "";
  const locationCode = base?.publicCode || "";
  const locationSlug = locationCode ? `${locationSlugRaw}-l${locationCode}` : locationSlugRaw;
  const titleSlug = (() => {
    if (Array.isArray(tour.translations)) {
      const tr = tour.translations.find((item) => item?.lang === language && item?.slug);
      if (tr?.slug) return tr.slug;
      const enTr = tour.translations.find((item) => item?.lang === "en" && item?.slug);
      if (enTr?.slug) return enTr.slug;
      return tour.translations[0]?.slug || tour.slug || "";
    }
    if (translationMap?.slug) {
      return translationMap.slug[language] || translationMap.slug.en || tour.slug || "";
    }
    return tour.slug || "";
  })();

  const imageUrl =
    tour.coverImageUrl ||
    tour.image ||
    (Array.isArray(tour.gallery) && tour.gallery[0]) ||
    "https://source.unsplash.com/400x250/?travel";

  const primaryLocationName =
    city?.name || country?.name || tour.city || tour.location?.name || "";

  const currencyCode = String(tour.currency || "USD").toUpperCase();
  const numericPrice = Number(tour.basePrice ?? tour.price);
  let priceLabel: string | null = null;
  if (!Number.isNaN(numericPrice) && numericPrice > 0) {
    try {
      priceLabel = new Intl.NumberFormat(language || "en", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numericPrice);
    } catch {
      priceLabel = `${numericPrice.toFixed(2)} ${currencyCode}`;
    }
  } else if (tour.basePrice) {
    priceLabel = `${tour.basePrice} ${currencyCode}`.trim();
  }

  const duration = tour.duration;
  let durationLabel: string | null = null;
  if (duration) {
    const minutes = Number(duration);
    if (!Number.isNaN(minutes) && minutes > 0) {
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const extraMinutes = minutes % 60;
        durationLabel = extraMinutes ? `${hours}h ${extraMinutes}min` : `${hours}h`;
      } else {
        durationLabel = `${minutes} min`;
      }
    } else if (typeof duration === "string") {
      durationLabel = duration;
    }
  }

  const groupSizeValue =
    tour.groupSize || tour.maxGroupSize || tour.customFields?.maxParticipants || tour.minGroupSize || null;
  const groupLabel = groupSizeValue ? `${groupSizeValue} personas` : null;

  const languageCodes = Array.isArray(tour.customFields?.languageCodes as string[])
    ? (tour.customFields?.languageCodes as string[])
    : [];
  const guideInfo = (tour.customFields?.guide as { languages?: string } | undefined)?.languages;
  const languagesArray = languageCodes.length
    ? languageCodes
    : typeof guideInfo === "string"
      ? guideInfo.split(",").map((lang) => lang.trim())
      : [];
  const languagesLabel = languagesArray.length ? languagesArray.map((code: string) => code.toUpperCase()).join(", ") : null;

  const hasFreeCancellation = Array.isArray(tour.cancellationPolicy?.refundTiers)
    ? tour.cancellationPolicy.refundTiers.some(
        (tier) => Number(tier.refundPercent ?? tier.refund_percent) === 100,
      )
    : false;
  const cancellationLabel = hasFreeCancellation ? "Cancelación gratis" : tour.cancellationPolicy?.title || null;

  const supplierName = tour.supplier?.company_name || tour.supplier?.name || null;

  const ratingValue = Number(tour.rating ?? tour.averageRating ?? tour.stars);
  const formattedRating = !Number.isNaN(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : null;
  const reviewsCount =
    typeof tour.reviewsCount === "number"
      ? tour.reviewsCount
      : Array.isArray(tour.reviews)
        ? tour.reviews.length
        : null;

  const isFeatured = Boolean(tour.isFeatured);

  // Migración fiel: usar solo slugs puros como en frontend clásico
  const tourPart = tour.publicCode ? `${titleSlug}-t${tour.publicCode}` : titleSlug;
  const href = locationSlug && titleSlug ? `/tours/${locationSlug}/${tourPart}` : `/tours/${tour.id}`;

  return {
    tour,
    title,
    shortDescription,
    href,
    imageUrl,
    primaryLocationName,
    priceLabel,
    durationLabel,
    groupLabel,
    languagesLabel,
    cancellationLabel,
    supplierName,
    formattedRating,
    reviewsCount,
    isFeatured,
  };
}
