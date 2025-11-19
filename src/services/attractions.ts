import { apiFetch } from "@/lib/http";
// Attraction type not defined in this package yet — use a loose alias until a proper type is added
type Attraction = any;
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

export async function fetchAttractionsList(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ data?: Attraction[]; total?: number; page?: number; pageSize?: number }>(`/attractions${suffix}`);
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
  // Accept either numeric id or attraction slug. If a slug is provided, resolve it
  // to the attraction numeric id first using the public detail endpoint.
  const maybeId = typeof attractionId === "number" ? attractionId : String(attractionId || "");
  let resolvedId: number | null = null;
  if (typeof maybeId === "number") {
    resolvedId = maybeId;
  } else if (/^\d+$/.test(maybeId)) {
    resolvedId = Number(maybeId);
  } else if (maybeId) {
    // Try to resolve slug to numeric id
    try {
      const attraction = await fetchAttractionBySlug(maybeId, params as Record<string, string | number | undefined>);
      if (attraction && (attraction as any).id) resolvedId = Number((attraction as any).id);
    } catch (_) {
      // ignore and let resolvedId remain null
    }
  }

  if (resolvedId === null || resolvedId === undefined || Number.isNaN(resolvedId)) {
    // Fallback: call the original path with provided identifier (may 404), keeping previous behavior
    return apiFetch<{ data?: Tour[]; [key: string]: unknown }>(`/attractions/${encodeURIComponent(String(attractionId))}/tours${suffix}`);
  }

  return apiFetch<{ data?: Tour[]; [key: string]: unknown }>(`/attractions/${resolvedId}/tours${suffix}`);
}
