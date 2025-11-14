"use client";

import { useMemo, useState } from "react";
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
        <ToursGrid tours={filteredTours} language={language} />
      </div>
    </div>
  );
}
