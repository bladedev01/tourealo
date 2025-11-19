"use client";

import dynamic from "next/dynamic";
import { useContext } from "react";
import type { Tour } from "@/types/tour";
import { ToursGrid } from "@/components/tours/ToursGrid";
import { LanguageServerContext } from "@/providers/LanguageServerContext";
import { TourCard } from "@/components/tours/TourCard";

const CarouselTours = dynamic(() => import("@/components/tours/CarouselTours"), { ssr: false });

export function FeaturedTours({
  tours,
  language,
  title = "Destacados",
  subtitle = "Seleccionados por nuestro equipo.",
  showHeader = true,
  limit,
  layout = "carousel",
}: {
  tours: Tour[];
  language: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  showHeader?: boolean;
  layout?: "grid" | "carousel";
}) {
  const languageServer = useContext(LanguageServerContext);
  const defaultLanguage = languageServer?.defaultLanguage;
  const shouldHidePrefix = Boolean(defaultLanguage) && language === defaultLanguage;
  const prefix = shouldHidePrefix ? "" : `/${language}`;

  const featured = (tours || []).filter((t) => Boolean((t as any).isFeatured));
  const list = typeof limit === "number" ? featured.slice(0, limit) : featured;

  if (!list.length) {
    return (
      <p className="text-sm text-slate-500">No encontramos tours destacados en este momento.</p>
    );
  }

  return (
    <section>
      {showHeader && (
        <header className="mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </header>
      )}

      {layout === "carousel" ? (
        <CarouselTours
          tours={list}
          renderItem={(t: Tour) => <TourCard key={t.id} tour={t} language={language} />}
        />
      ) : (
        <ToursGrid tours={list} language={language} />
      )}
    </section>
  );
}
