import { apiFetch } from "@/lib/http";
import type { Attraction } from "@/types/attraction";
import type { Tour } from "@/types/tour";

export async function fetchAttractionBySlug(slug: string, params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Attraction>(`/attractions/${encodeURIComponent(slug)}${suffix}`);
}

export async function fetchAttractionTours(
  attractionId: string | number,
  params: Record<string, string | number | undefined> = {},
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ data?: Tour[]; [key: string]: unknown }>(`/attractions/${attractionId}/tours${suffix}`);
}
