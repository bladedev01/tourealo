"use client";

import Image from "next/image";
import { CalendarDays, Globe2, MapPin, ShieldCheck, Users, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useMemo } from "react";

import { useTranslation } from "@/hooks/useTranslation";
import { ToursGrid } from "@/components/tours/ToursGrid";
import type { Attraction, AttractionTranslation } from "@/types/attraction";
import type { Tour } from "@/types/tour";

export type AttractionDetailViewProps = {
  attraction: Attraction;
  translation: AttractionTranslation | null;
  tours: Tour[];
  language: string;
  prefix: string;
  brandName: string;
};

const getImage = (attraction: Attraction) => {
  if (attraction.metadata && typeof attraction.metadata === "object" && "image" in attraction.metadata) {
    const metaImage = (attraction.metadata as Record<string, unknown>).image;
    if (typeof metaImage === "string" && metaImage.length > 0) {
      return metaImage;
    }
  }
  const gallery = (attraction as any)?.images;
  if (Array.isArray(gallery) && typeof gallery[0] === "string") {
    return gallery[0];
  }
  return null;
};

const applyTemplate = (template: string, replacements: Record<string, string | number>) =>
  Object.entries(replacements).reduce(
    (output, [key, value]) => output.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );

export function AttractionDetailView({ attraction, translation, tours, language, prefix, brandName }: AttractionDetailViewProps) {
  const { t } = useTranslation("frontend-attraction");
  const image = getImage(attraction);
  const title = translation?.name || attraction.slug || "";
  const shortDescription = translation?.shortDescription || (attraction as any)?.shortDescription || null;
  const parentLocation = attraction.parentLocation?.name;




  const highlights = useMemo(
    () => [
      {
        icon: <CalendarDays className="h-5 w-5 text-emerald-500" />,
        label: t("highlights.flexible", "Cancelación flexible en la mayoría de experiencias"),
      },
      {
        icon: <Users className="h-5 w-5 text-sky-500" />,
        label: t("highlights.groups", "Opciones para grupos y actividades privadas"),
      },
      {
        icon: <Globe2 className="h-5 w-5 text-indigo-500" />,
        label: t("highlights.languages", "Guías locales en los principales idiomas"),
      },
      {
        icon: <ShieldCheck className="h-5 w-5 text-amber-500" />,
        label: t("highlights.safe", "Proveedores verificados con soporte 24/7"),
      },
    ],
    [t],
  );

  const relatedTitle = applyTemplate(t("relatedTours", "Tours relacionados en {attraction}"), { attraction: title });
  const relatedSubtitle = applyTemplate(
    t("relatedToursSubtitle", "Explora experiencias recomendadas por el equipo de {brand}"),
    { brand: brandName },
  );

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        {/* El selector de idioma local ha sido eliminado. El cambio de idioma debe ser global, como en tours. */}
        <nav className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          <a href={prefix || "/"} className="transition hover:text-emerald-600">
            {t("breadcrumbs.home", "Inicio")}
          </a>
          <span className="mx-2 text-slate-400">/</span>
          <span className="text-slate-700">{t("breadcrumbs.attractions", "Atracciones")}</span>
        </nav>
        <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">{title}</h1>
            {parentLocation && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>{parentLocation}</span>
              </div>
            )}
            {shortDescription && <p className="mt-4 text-base text-slate-600">{shortDescription}</p>}
              <div className="mt-6 flex items-center gap-3">
                <Link href={`${prefix}/tours?attraction=${attraction.id}`}>
                  <Button size="md" variant="primary">
                    <span className="mr-2 inline-flex items-center"><ShoppingCart className="h-4 w-4" /></span>
                    {t("cta.book", "View tours & book")}
                  </Button>
                </Link>
                <a href={`mailto:contact@tourealo.dev?subject=Supplier%20info%20for%20${encodeURIComponent(title)}`} className="text-sm text-slate-600 hover:underline">
                  {t("cta.contact", "Contact supplier")}
                </a>
              </div>
            {attraction.publicCode && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                <span className="opacity-70">{t("publicCode", "Código")}</span>
                <span className="text-slate-800">{attraction.publicCode}</span>
              </div>
            )}
          </div>
          {image && (
            <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm lg:h-72 lg:w-[420px]">
              <Image src={image} alt={title} fill className="object-cover" sizes="(min-width: 1280px) 420px, 100vw" unoptimized />
            </div>
          )}
        </header>
        <section className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {highlights.map((item, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-inner">{item.icon}</span>
              <span className="text-sm text-slate-600">{item.label}</span>
            </div>
          ))}
        </section>
        <section className="mt-12 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{relatedTitle}</h2>
              <p className="text-sm text-slate-600">{relatedSubtitle}</p>
            </div>
          </div>
          {tours.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
              {t("noRelatedTours", "No hay tours relacionados disponibles por el momento.")}
            </div>
          ) : (
            <ToursGrid tours={tours} language={language} />
          )}
        </section>
      </div>
    </div>
  );
}
