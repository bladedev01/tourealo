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

function pickLocation(tour: Partial<Tour> | undefined) {
  const locations = Array.isArray(tour?.locations) ? tour!.locations : undefined;
  if (Array.isArray(locations) && locations.length) {
    const city = locations.find((loc: LocationRef) => loc.type === "city");
    const country = locations.find((loc: LocationRef) => loc.type === "country");
    const base = city || locations[0];
    return { city, country, base };
  }
  return { city: undefined, country: undefined, base: tour?.location };
}

export function buildTourDisplay(tour: Partial<Tour> = {}, language: string) {
  const translationMap = Array.isArray(tour.translations as any)
    ? mapTranslationsArrayToObject(tour.translations as any)
    : (tour.translations as Record<string, Record<string, string>> | undefined);

  const title =
    getLocaleValue(translationMap?.title, language) ||
    getLocaleValue((translationMap as Record<string, Record<string, string>> | undefined)?.name, language) ||
    (tour.name as string | undefined) ||
    (tour.title as string | undefined) ||
    "";

  const shortDescription =
    getLocaleValue(translationMap?.shortDescription, language) ||
    getLocaleValue(translationMap?.description, language) ||
    (tour.shortDescription as string | undefined) ||
    "";

  const { city, country, base } = pickLocation(tour);
  // Construir slugs canónicos: [slug]-[publicCode]
  const locationSlug = base?.slug && base?.publicCode ? `${base.slug}-${base.publicCode}` : base?.slug || "";
  const titleSlug = (() => {
    let slug = "";
    if (Array.isArray(tour.translations)) {
      const tr = tour.translations.find((item) => item?.lang === language && item?.slug);
      if (tr?.slug) slug = tr.slug;
      else {
        const enTr = tour.translations.find((item) => item?.lang === "en" && item?.slug);
        if (enTr?.slug) slug = enTr.slug;
        else slug = tour.translations[0]?.slug || tour.slug || "";
      }
    } else if (translationMap?.slug) {
      slug = translationMap.slug[language] || translationMap.slug.en || tour.slug || "";
    } else {
      slug = tour.slug || "";
    }
    return slug && tour.publicCode ? `${slug}-${tour.publicCode}` : slug;
  })();
  const imageUrl =
    (tour.coverImageUrl as string | undefined) ||
    (tour.image as string | undefined) ||
    (Array.isArray(tour.gallery as any) && (tour.gallery as any)[0]) ||
    "https://source.unsplash.com/400x250/?travel";

  const primaryLocationName =
    city?.name || country?.name || (tour.city as string | undefined) || tour.location?.name || "";

  const currencyCode = String(tour.currency || "USD").toUpperCase();
  const numericPrice = Number((tour.basePrice as any) ?? (tour.price as any));
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

  const duration = tour.duration as number | string | undefined;
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
    (tour.groupSize as any) || (tour.maxGroupSize as any) || (tour.customFields as any)?.maxParticipants || (tour.minGroupSize as any) || null;
  const groupLabel = groupSizeValue ? `${groupSizeValue} personas` : null;

  const languageCodes = Array.isArray((tour.customFields as any)?.languageCodes as string[])
    ? ((tour.customFields as any).languageCodes as string[])
    : [];
  const guideInfo = ((tour.customFields as any)?.guide as { languages?: string } | undefined)?.languages;
  const languagesArray = languageCodes.length
    ? languageCodes
    : typeof guideInfo === "string"
      ? guideInfo.split(",").map((lang) => lang.trim())
      : [];
  const languagesLabel = languagesArray.length ? languagesArray.map((code: string) => code.toUpperCase()).join(", ") : null;

  const hasFreeCancellation = Array.isArray((tour.cancellationPolicy as any)?.refundTiers)
    ? (tour.cancellationPolicy as any).refundTiers.some(
        (tier: any) => Number(tier.refundPercent ?? tier.refund_percent) === 100,
      )
    : false;
  const cancellationLabel = hasFreeCancellation ? "Cancelación gratis" : (tour.cancellationPolicy as any)?.title || null;

  const supplierName = (tour.supplier as any)?.company_name || (tour.supplier as any)?.name || null;

  const ratingValue = Number((tour.rating as any) ?? (tour.averageRating as any) ?? (tour.stars as any));
  const formattedRating = !Number.isNaN(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : null;
  const reviewsCount =
    typeof (tour.reviewsCount as any) === "number"
      ? (tour.reviewsCount as any)
      : Array.isArray(tour.reviews as any)
        ? (tour.reviews as any).length
        : null;

  const isFeatured = Boolean(tour.isFeatured);

  const href = locationSlug && titleSlug ? `/tours/${locationSlug}/${titleSlug}` : `/tours/${(tour.id as any) || ""}`;

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
