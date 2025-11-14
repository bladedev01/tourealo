import { apiFetch } from "@/lib/http";
import type { Tour, TourDetail } from "@/types/tour";

type GetToursParams = {
  orderBy?: string;
  orderDir?: "ASC" | "DESC";
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
};

type PaginatedToursResponse = {
  data: Tour[];
  total: number;
  page: number;
  pageSize: number;
};

export async function fetchTours(
  params: GetToursParams = {},
  options?: { cacheTag?: string },
): Promise<PaginatedToursResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    query.set(key, String(value));
  });
  const search = query.toString();
  const path = search ? `/tours?${search}` : "/tours";
  const response = await apiFetch<PaginatedToursResponse | Tour[]>(path, {
    isServer: typeof window === "undefined",
    cacheTag: options?.cacheTag,
  });
  if (Array.isArray(response)) {
    const fallbackSize = response.length > 0 ? response.length : 1;
    return {
      data: response,
      total: response.length,
      page: Number(params.page ?? 1),
      pageSize: Number(params.pageSize ?? fallbackSize),
    };
  }

  return {
    data: response.data ?? [],
    total: typeof response.total === "number" ? response.total : response.data?.length ?? 0,
    page: typeof response.page === "number" ? response.page : Number(params.page ?? 1),
    pageSize: typeof response.pageSize === "number" ? response.pageSize : Number(params.pageSize ?? response.data?.length ?? 1),
  };
}

export async function fetchTourDetail({
  locationSlug,
  titleSlug,
  lang,
}: {
  locationSlug: string;
  titleSlug: string;
  lang?: string;
}): Promise<TourDetail> {
  const search = new URLSearchParams();
  if (lang) search.set("lang", lang);
  const query = search.toString();
  const path = query ? `/tours/${locationSlug}/${titleSlug}?${query}` : `/tours/${locationSlug}/${titleSlug}`;
  return apiFetch<TourDetail>(path, { isServer: typeof window === "undefined" });
}
