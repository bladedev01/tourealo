"use client";
import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";
import type { Tour } from "@/types/tour";
import { buildTourDisplay } from "@/lib/tour-utils";
import { Button } from "@/components/ui/Button";
import { LanguageServerContext } from "@/providers/LanguageServerContext";

export function TourCard({ tour, language }: { tour: Tour; language: string }) {
  const languageServer = useContext(LanguageServerContext);
  const defaultLanguage = languageServer?.defaultLanguage;
  const display = buildTourDisplay(tour, language);
  const prefix = defaultLanguage && language === defaultLanguage ? "" : `/${language}`;
  const href = prefix ? `${prefix}${display.href}` : display.href;

  if (!display.href) return null;

  return (
    <article className="w-full min-w-0 flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} className="relative block aspect-[4/2.7] w-full overflow-hidden min-h-[140px]">
        <Image
          src={display.imageUrl}
          alt={display.title || "Tour"}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          priority={display.isFeatured}
          unoptimized
        />
        {display.isFeatured && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-400/90 px-3 py-1 text-[12px] font-semibold text-amber-900 shadow">
            Destacado
          </span>
        )}
        {display.priceLabel && (
          <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-emerald-700 shadow">
            {display.priceLabel}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2" title={display.title}>
            <Link href={href}>{display.title}</Link>
          </h3>
          {display.primaryLocationName && (
            <p className="mt-0.5 text-xs text-slate-500">{display.primaryLocationName}</p>
          )}
        </div>
        {display.shortDescription && (
          <p className="text-xs text-slate-600 line-clamp-3">{display.shortDescription}</p>
        )}
        <dl className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
          {display.durationLabel && (
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">⏱</span>
              <span>{display.durationLabel}</span>
            </div>
          )}
          {display.groupLabel && (
            <div className="flex items-center gap-1">
              <span className="text-blue-500">👥</span>
              <span>{display.groupLabel}</span>
            </div>
          )}
          {display.languagesLabel && (
            <div className="flex items-center gap-1">
              <span className="text-indigo-500">🌐</span>
              <span>{display.languagesLabel}</span>
            </div>
          )}
          {display.cancellationLabel && (
            <div className="flex items-center gap-1">
              <span className="text-rose-500">✅</span>
              <span>{display.cancellationLabel}</span>
            </div>
          )}
        </dl>
        <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500">
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
        <Button href={href} variant="primary" className="mt-1 py-1 px-3 text-xs">
          Ver detalles
        </Button>
      </div>
      </article>
  );
}
