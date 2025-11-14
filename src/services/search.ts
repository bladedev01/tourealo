import { apiFetch } from "@/lib/http";

export type SuggestLocation = {
  id: number | string;
  name: string;
  slug?: string | null;
  publicCode?: string | null;
  type?: string | null;
  country?: string | null;
  countActivities?: number | null;
  image?: string | null;
};

export type SuggestCategory = {
  id: number | string;
  name: string;
  slug?: string | null;
  countActivities?: number | null;
};

export type SuggestTour = {
  id: number | string;
  title: string;
  type?: string | null;
  image?: string | null;
  locationName?: string | null;
  locationSlug?: string | null;
  locationCode?: string | null;
  titleSlug?: string | null;
  tourCode?: string | null;
};

export type SuggestAttraction = {
  id: number | string;
  name: string;
  slug?: string | null;
  publicCode?: string | null;
  type?: string | null;
  image?: string | null;
  locationName?: string | null;
  countTours?: number | null;
};

export type SearchSuggestResponse = {
  locations: SuggestLocation[];
  categories: SuggestCategory[];
  tours: SuggestTour[];
  attractions: SuggestAttraction[];
};

export type FetchSearchSuggestParams = {
  query: string;
  lang?: string;
  limit?: number;
  locationSlug?: string;
  locationCode?: string;
  signal?: AbortSignal;
};

const EMPTY_RESPONSE: SearchSuggestResponse = {
  locations: [],
  categories: [],
  tours: [],
  attractions: [],
};

export async function fetchSearchSuggestions({
  query,
  lang,
  limit,
  locationSlug,
  locationCode,
  signal,
}: FetchSearchSuggestParams): Promise<SearchSuggestResponse> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return EMPTY_RESPONSE;
  }

  const params = new URLSearchParams();
  params.set("q", trimmed);
  if (lang && lang.length > 0) {
    const normalized = lang.includes("-") ? lang.split("-")[0] : lang;
    params.set("lang", normalized);
  }
  if (limit) {
    params.set("limit", String(Math.min(Math.max(limit, 1), 10)));
  }
  if (locationSlug) {
    params.set("locationSlug", locationSlug);
  }
  if (locationCode) {
    params.set("locationCode", locationCode);
  }

  const queryString = params.toString();
  const path = queryString ? `/search/suggest?${queryString}` : "/search/suggest";

  try {
    return await apiFetch<SearchSuggestResponse>(path, { signal });
  } catch (error) {
    console.error("Failed to fetch search suggestions", error);
    return EMPTY_RESPONSE;
  }
}
