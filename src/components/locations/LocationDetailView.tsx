"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { AttractionCard } from "@/components/attractions/AttractionCard";
import { LocationCard } from "@/components/locations/LocationCard";
import { useTranslation } from "@/hooks/useTranslation";
import { ToursGrid } from "@/components/tours/ToursGrid";
import type { Location } from "@/types/location";
import type { Tour } from "@/types/tour";

export type LocationDetailViewProps = {
  location: Location;
  tours: Tour[];
  language: string;
};

function formatSlugName(slug: string) {
  return slug
    .replace(/-l[a-zA-Z0-9]+$/, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function LocationDetailView({ location, tours, language }: LocationDetailViewProps) {
  const { t } = useTranslation("frontend-location");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [priceOrder, setPriceOrder] = useState("");
  const description = typeof location.metadata?.description === "string" ? location.metadata.description : null;

  const filteredTours = useMemo(() => {
    let result = [...tours];
    if (categoryFilter) {
      result = result.filter((tour) => String((tour as any)?.category || "").toLowerCase() === categoryFilter.toLowerCase());
    }
    if (durationFilter) {
      result = result.filter((tour) => String(tour.duration || "").toLowerCase() === durationFilter.toLowerCase());
    }
    if (priceOrder === "asc") {
      result = [...result].sort(
        (a, b) => (Number(a.basePrice ?? a.price ?? 0) || 0) - (Number(b.basePrice ?? b.price ?? 0) || 0),
      );
    } else if (priceOrder === "desc") {
      result = [...result].sort(
        (a, b) => (Number(b.basePrice ?? b.price ?? 0) || 0) - (Number(a.basePrice ?? a.price ?? 0) || 0),
      );
    }
    return result;
  }, [tours, categoryFilter, durationFilter, priceOrder]);

  const title = location.name || formatSlugName(location.slug || "") || t("locationFallback", "Destino sin título");

  // Related attractions state
  const [relatedAttractions, setRelatedAttractions] = useState<any[]>([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});

  // Child cities state (for country pages)
  const [childCities, setChildCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch tours count per related attraction (if API exposes `total`)
  useEffect(() => {
    let mounted = true;
    async function loadCounts() {
      if (!relatedAttractions || relatedAttractions.length === 0) return;
      try {
        const svc = await import("@/services/attractions");
        const promises = relatedAttractions.map(async (attr) => {
          try {
            const res = await svc.fetchAttractionTours(attr.id, { lang: language, pageSize: 1 });
            // prefer `total` if provided by backend
            const total = (res && (res.total || (res.meta && res.meta.total))) ?? (Array.isArray(res.data) ? res.data.length : undefined);
            return { key: String(attr.id || attr.slug || attr.href || ""), total: typeof total === "number" ? total : undefined };
          } catch (e) {
            return { key: String(attr.id || attr.slug || attr.href || ""), total: undefined };
          }
        });
        const results = await Promise.all(promises);
        if (!mounted) return;
        const map: Record<string, number> = {};
        results.forEach((r) => {
          if (typeof r.total === "number") map[r.key] = r.total;
        });
        setCountsMap(map);
      } catch (err) {
        // ignore
      }
    }
    void loadCounts();
    return () => {
      mounted = false;
    };
  }, [relatedAttractions, language]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingAttractions(true);
      try {
        const resp = await (await import("@/services/attractions")).fetchAttractionsList({ lang: language, pageSize: 100 });
        const all = (resp && (resp.data || resp)) || [];

        // Build a set of allowed location ids that should be considered "in scope"
        // This handles country -> regions -> cities hierarchy so that a country page
        // shows attractions that belong to any city/region inside the country.
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const allowedIds = new Set<string>();
        if (location && location.id) allowedIds.add(String(location.id));

        // If viewing a country, include its regions and their cities
        if (location && location.type === 'country') {
          try {
            const regionsUrl = apiBase
              ? `${apiBase}/locations/regions?countryId=${encodeURIComponent(String(location.id))}`
              : `/api/locations/regions?countryId=${encodeURIComponent(String(location.id))}`;
            const regionsResp = await fetch(regionsUrl);
            const regionsJson = regionsResp.ok ? await regionsResp.json() : null;
            const regions = Array.isArray(regionsJson) ? regionsJson : (regionsJson && regionsJson.value ? regionsJson.value : []);
            for (const r of regions) {
              if (r && r.id) allowedIds.add(String(r.id));
            }
            // fetch cities for each region
            const cityPromises = regions.map(async (r: any) => {
              const citiesUrl = apiBase
                ? `${apiBase}/locations/cities?regionId=${encodeURIComponent(String(r.id))}`
                : `/api/locations/cities?regionId=${encodeURIComponent(String(r.id))}`;
              const res = await fetch(citiesUrl);
              if (!res.ok) return [];
              const data = await res.json();
              return Array.isArray(data) ? data : (data && data.value ? data.value : []);
            });
            const citiesNested = await Promise.all(cityPromises);
            const citiesFlat = citiesNested.flat();
            for (const c of citiesFlat) {
              if (c && c.id) allowedIds.add(String(c.id));
            }
          } catch (err) {
            // ignore region/city fetch errors — we'll fall back to basic matching
          }
        }

        // If viewing a region, include its cities
        if (location && location.type === 'region') {
          try {
            const citiesUrl = apiBase
              ? `${apiBase}/locations/cities?regionId=${encodeURIComponent(String(location.id))}`
              : `/api/locations/cities?regionId=${encodeURIComponent(String(location.id))}`;
            const res = await fetch(citiesUrl);
            if (res.ok) {
              const data = await res.json();
              const list = Array.isArray(data) ? data : (data && data.value ? data.value : []);
              for (const c of list) if (c && c.id) allowedIds.add(String(c.id));
            }
          } catch (err) {
            // ignore
          }
        }

        const normalizeSlugBase = (s: string | undefined | null) => {
          if (!s) return s;
          return String(s).replace(/-l[A-Za-z0-9]+$/, "");
        };
        const locationBaseSlug = normalizeSlugBase(location.slug || null);

        const filtered = (all as any[]).filter((a) => {
          const parent = a.parentLocation || a.parent_location || null;
          if (!parent) return false;
          // direct match by allowed ids (city, region, country)
          if (parent.id && allowedIds.has(String(parent.id))) return true;
          // parent may reference a region via parent.parent_id
          const parentParentId = parent.parent_id ?? parent.parentId ?? null;
          if (parentParentId && allowedIds.has(String(parentParentId))) return true;
          // If both have slugs, compare their base slugs (without publicCode suffixes)
          const parentBaseSlug = normalizeSlugBase(parent.slug || null);
          if (locationBaseSlug && parentBaseSlug && parentBaseSlug === locationBaseSlug) return true;
          // match by publicCode if available (parent.publicCode may exist)
          if (location.slug && parent.publicCode) {
            const locCodeMatch = String(location.slug).match(/-l[0-9A-Za-z]+$/);
            if (locCodeMatch && String(locCodeMatch[0]).slice(1) === String(parent.publicCode)) return true;
          }
          return false;
        });
        if (mounted) setRelatedAttractions(filtered.slice(0, 8));
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoadingAttractions(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [location.slug, location.id, language]);

  // Load child cities when viewing a country
  // Load child cities when viewing a country
  useEffect(() => {
    let mounted = true;
    async function loadCities() {
      if (!location || location.type !== 'country') return;
      setLoadingCities(true);
      try {
        // 1) get regions for this country
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const regionsUrl = apiBase
          ? `${apiBase}/locations/regions?countryId=${encodeURIComponent(String(location.id))}`
          : `/api/locations/regions?countryId=${encodeURIComponent(String(location.id))}`;
        const regionsResp = await fetch(regionsUrl);
        const regionsJson = regionsResp.ok ? await regionsResp.json() : [];
        // support backend shape { value: [], Count } or direct array
        const regionList = Array.isArray(regionsJson) ? regionsJson : (regionsJson && regionsJson.value ? regionsJson.value : []);
        // 2) fetch cities for each region in parallel
        const cityPromises = regionList.map(async (r: any) => {
          const citiesUrl = apiBase
            ? `${apiBase}/locations/cities?regionId=${encodeURIComponent(String(r.id))}`
            : `/api/locations/cities?regionId=${encodeURIComponent(String(r.id))}`;
          const res = await fetch(citiesUrl);
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : (data && data.value ? data.value : []);
        });
        const citiesNested = await Promise.all(cityPromises);
        const citiesFlat = citiesNested.flat();
        if (mounted) setChildCities(citiesFlat.slice(0, 12));
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoadingCities(false);
      }
    }
    void loadCities();
    return () => { mounted = false; };
  }, [location.id, location.type]);

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
          )}
        </header>
        <div className="mb-8 flex flex-wrap gap-4">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t("filters.allCategories", "Todas las categorías")}</option>
            <option value="tour">{t("filters.category.tour", "Tour")}</option>
            <option value="flamenco">{t("filters.category.flamenco", "Flamenco")}</option>
            <option value="museum">{t("filters.category.museum", "Museo")}</option>
          </select>
          <select
            value={durationFilter}
            onChange={(event) => setDurationFilter(event.target.value)}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t("filters.allDurations", "Todas las duraciones")}</option>
            <option value="1 hora">1 {t("filters.hour", "hora")}</option>
            <option value="12 horas">12 {t("filters.hours", "horas")}</option>
            <option value="1 día">1 {t("filters.day", "día")}</option>
          </select>
          <select
            value={priceOrder}
            onChange={(event) => setPriceOrder(event.target.value)}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t("filters.order", "Ordenar por")}</option>
            <option value="asc">{t("filters.priceLowHigh", "Precio: menor a mayor")}</option>
            <option value="desc">{t("filters.priceHighLow", "Precio: mayor a menor")}</option>
          </select>
        </div>
        {/* related attractions placeholder moved below tours */}
        <ToursGrid tours={filteredTours} language={language} />

        {/* Child cities (for country pages) - shown after tours */}
        {location?.type === 'country' && (
          <div className="mt-12">
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">{`${t('citiesOfPrefix', 'Ciudades de')} ${location.name}`}</h2>
            {loadingCities ? (
              <div className="text-sm text-slate-500">{t('loading', 'Cargando...')}</div>
            ) : childCities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                {t('noCities', 'No hay ciudades relacionadas para este país.')}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {childCities.map((c) => (
                  <LocationCard key={c.id} location={c} hrefPrefix="" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related attractions (professional card layout) */}
        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">{t("relatedAttractions", "Atracciones relacionadas")}</h2>
          <p className="mb-6 text-sm text-slate-600">{t("relatedAttractionsIntro", "Explora atracciones y lugares de interés cercanos a este destino.")}</p>
          {loadingAttractions ? (
            <div className="text-sm text-slate-500">{t("loading", "Cargando...")}</div>
          ) : relatedAttractions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
              {t("noRelatedAttractions", "No hay atracciones relacionadas para este destino.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedAttractions.map((attr) => {
                const slug = attr.slug || "";
                const href = slug && attr.publicCode ? `/attractions/${slug}-${attr.publicCode}` : slug ? `/attractions/${slug}` : (attr.href || "#");
                return (
                  <AttractionCard
                    key={attr.id || href}
                    attraction={attr}
                    href={href}
                    toursCount={countsMap[String(attr.id || attr.slug || href)]}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
