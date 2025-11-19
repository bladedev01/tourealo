"use client";

import Link from "next/link";
import type { Location } from "@/types/location";
import { LocationCard } from "@/components/locations/LocationCard";

export function FeaturedLocations({
  locations,
  hrefPrefix = "",
  title = "Destinos populares",
  subtitle,
  limit = 12,
  viewAllHref = "/",
  viewAllLabel = "Ver todos los destinos",
  showHeader = true,
}: {
  locations: Location[];
  hrefPrefix?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
  showHeader?: boolean;
}) {
  const list = (locations || []).slice(0, limit);

  if (!list.length) {
    return <p className="text-sm text-slate-500">No hay destinos disponibles.</p>;
  }

  return (
    <section>
      {showHeader && (
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="shrink-0">
            <Link href={hrefPrefix ? `${hrefPrefix}${viewAllHref}` : viewAllHref} className="text-sm font-medium text-sky-600 hover:underline">
              {viewAllLabel}
            </Link>
          </div>
        </header>
      )}

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
        {list.map((loc) => (
          <LocationCard key={loc.id} location={loc} hrefPrefix={hrefPrefix} />
        ))}
      </div>
    </section>
  );
}
