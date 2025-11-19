import Image from "next/image";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";

export type AttractionCardProps = {
  attraction: any;
  href: string;
  toursCount?: number | null;
};

export const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, href, toursCount = null }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const shortLang = typeof language === "string" && language.includes("-") ? language.split("-")[0] : language || "en";

  const translations = Array.isArray(attraction?.translations) ? attraction.translations : [];
  const matched = translations.find((tr: any) => {
    const l = String(tr?.lang || "").toLowerCase();
    return l === String(shortLang).toLowerCase() || (l && l.split("-")[0] === String(shortLang).toLowerCase());
  }) || translations[0] || null;

  const name = (matched && matched.name) || attraction.name || attraction.slug || "";
  const parent = attraction.parentLocation || attraction.parent_location || null;
  const parentName = (parent && (parent.name || (parent.translations && parent.translations[0] && parent.translations[0].name))) || null;
  const img = attraction.metadata && (attraction.metadata.heroImage || attraction.metadata.image) ? String(attraction.metadata.heroImage || attraction.metadata.image) : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      <a href={href} className="relative block h-44 w-full overflow-hidden bg-slate-100">
        {img ? (
          // next/image used with fill
          <Image src={img} alt={name} fill className="object-cover" sizes="(min-width: 1024px) 320px, 100vw" />
        ) : (
          <div className="flex h-44 items-center justify-center text-slate-400">Sin imagen</div>
        )}
      </a>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <a href={href} className="text-lg font-semibold text-slate-900 line-clamp-2 hover:underline">{name}</a>
        </div>
        {parent && <div className="text-sm text-slate-500">{parentName || parent.name}</div>}
        <div className="mt-auto">
          <div className="mt-4">
            <div className="flex flex-col">
              <span className="text-2xl font-semibold text-emerald-700">{typeof toursCount === 'number' ? toursCount : 0}</span>
              <span className="text-sm text-emerald-600">{(typeof toursCount === 'number' && toursCount === 1) ? t('activity', 'actividad') : t('activities', 'actividades')}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
