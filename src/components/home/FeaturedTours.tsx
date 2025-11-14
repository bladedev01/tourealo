"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";
import { buildTourDisplay } from "@/lib/tour-utils";
import type { Tour } from "@/types/tour";
import { LanguageServerContext } from "@/providers/LanguageServerContext";

export function FeaturedTours({ tours, language }: { tours: Tour[]; language: string }) {
  const languageServer = useContext(LanguageServerContext);
  const contextDefault = languageServer?.defaultLanguage;
  const shouldHidePrefix = Boolean(contextDefault) && language === contextDefault;
  const prefix = shouldHidePrefix ? "" : `/${language}`;
  if (!tours.length) {
    return (
      <p className="text-sm text-slate-500">No encontramos tours disponibles en este momento.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {tours.map((tour) => {
        const display = buildTourDisplay(tour, language);
        const localizedHref = prefix ? `${prefix}${display.href}` : display.href;
        return (
          <article
            key={String(tour.id)}
            className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <Link href={localizedHref} className="relative block aspect-[4/3] w-full overflow-hidden">
              <Image
                src={display.imageUrl}
                alt={display.title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={tour.isFeatured === true}
                unoptimized
              />
              {display.isFeatured && (
                <span className="absolute left-4 top-4 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow">
                  Destacado
                </span>
              )}
              {display.priceLabel && (
                <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow">
                  {display.priceLabel}
                </span>
              )}
            </Link>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" title={display.title}>
                  <Link href={localizedHref}>{display.title}</Link>
                </h3>
                {display.primaryLocationName && (
                  <p className="mt-1 text-sm text-slate-500">{display.primaryLocationName}</p>
                )}
              </div>
              {display.shortDescription && (
                <p className="text-sm text-slate-600 line-clamp-3">{display.shortDescription}</p>
              )}
              <dl className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
                {display.durationLabel && (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">⏱</span>
                    <span>{display.durationLabel}</span>
                  </div>
                )}
                {display.groupLabel && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">👥</span>
                    <span>{display.groupLabel}</span>
                  </div>
                )}
                {display.languagesLabel && (
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-500">🌐</span>
                    <span>{display.languagesLabel}</span>
                  </div>
                )}
                {display.cancellationLabel && (
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500">✅</span>
                    <span>{display.cancellationLabel}</span>
                  </div>
                )}
              </dl>
              <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                {display.formattedRating ? (
                  <span className="font-semibold text-amber-600">
                    ⭐ {display.formattedRating}
                    {display.reviewsCount ? ` · ${display.reviewsCount} reseñas` : ""}
                  </span>
                ) : (
                  <span>Sin reseñas aún</span>
                )}
                {display.supplierName && <span>Proveedor: {display.supplierName}</span>}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
