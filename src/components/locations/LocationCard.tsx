import Link from "next/link";
import Image from "next/image";
import type { Location } from "@/types/location";

export type LocationCardProps = {
  location: Location;
  hrefPrefix?: string;
};

export function LocationCard({ location, hrefPrefix = "" }: LocationCardProps) {
  const canonicalSlug = location.slug && location.publicCode ? `${location.slug}-l${location.publicCode}` : location.slug || "";
  return (
    <Link
      key={location.id}
      href={canonicalSlug ? `${hrefPrefix}/${canonicalSlug}` : "#"}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50"
    >
      <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {location.image ? (
          <Image src={String(location.image)} alt={location.name || ""} className="h-full w-full object-cover" width={64} height={64} unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-slate-400">Sin imagen</span>
        )}
      </div>
      <span className="mt-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-700">{location.name}</span>
    </Link>
  );
}
