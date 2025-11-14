export type LocationRef = {
  id?: number;
  slug?: string;
  name?: string;
  type?: string;
  publicCode?: string;
};

export type TourTranslation = {
  lang?: string;
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  name?: string;
  longDescription?: string;
  highlights?: string;
  included?: string;
  notIncluded?: string;
  itinerary?: string;
};

export type TourTranslationMap = {
  name?: Record<string, string>;
  title?: Record<string, string>;
  slug?: Record<string, string>;
  shortDescription?: Record<string, string>;
  description?: Record<string, string>;
  longDescription?: Record<string, string>;
  highlights?: Record<string, string>;
  included?: Record<string, string>;
  notIncluded?: Record<string, string>;
  itinerary?: Record<string, string>;
};

export type TourMedia = {
  id?: number;
  url?: string;
  order?: number;
  title?: string;
  altText?: string;
};

export type TourCancellationPolicy = {
  title?: string;
  summary?: string;
  legalText?: string;
  type?: string;
  shortMessage?: string;
  promoMessage?: string;
  refundTiers?: Array<{
    refundPercent?: number;
    refund_percent?: number;
    percent?: number;
    hoursBefore?: number;
    unit?: string;
    value?: number;
    amount?: number;
    qty?: number;
  }>;
};

export type Tour = {
  id: number | string;
  publicCode?: string;
  title?: string;
  name?: string;
  slug?: string;
  coverImageUrl?: string;
  image?: string;
  gallery?: string[];
  location?: LocationRef;
  locations?: LocationRef[];
  translations?: TourTranslation[] | Record<string, Record<string, string>> | TourTranslationMap;
  shortDescription?: string;
  description?: string;
  longDescription?: string;
  currency?: string;
  basePrice?: number | string;
  price?: number | string;
  duration?: number | string;
  groupSize?: number;
  maxGroupSize?: number;
  minGroupSize?: number;
  customFields?: Record<string, unknown>;
  cancellationPolicy?: TourCancellationPolicy;
  supplier?: {
    company_name?: string;
    name?: string;
    company_slug?: string;
    logo_url?: string;
    website_url?: string;
    country?: string;
  };
  rating?: number;
  averageRating?: number;
  stars?: number;
  reviewsCount?: number;
  reviews?: Array<Record<string, unknown>>;
  isFeatured?: boolean;
  city?: string;
  country?: string;
  media?: TourMedia[];
};

export type TourDetail = Tour & {
  translations?: TourTranslationMap;
};
