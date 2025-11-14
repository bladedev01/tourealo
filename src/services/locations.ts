// Fetch all locations for home page
export async function fetchLocationsList(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ data?: Location[]; [key: string]: unknown }>(`/locations${suffix}`);
}
import { apiFetch } from "@/lib/http";
import type { Location } from "@/types/location";
import type { Tour } from "@/types/tour";

export async function fetchLocationBySlug(slug: string) {
  return apiFetch<Location>(`/locations/${encodeURIComponent(slug)}`);
}

export async function fetchLocationTours(
  slug: string,
  params: Record<string, string | number | undefined> = {},
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ data?: Tour[]; [key: string]: unknown }>(`/locations/${encodeURIComponent(slug)}/tours${suffix}`);
}
