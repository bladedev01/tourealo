"use client";
import React, { useState } from "react";

interface TabItem {
  slug: string;
  name: string;
  count: number;
  href: string;
  publicCode?: string;
}

interface PopularTabsProps {
  attractions: TabItem[];
  destinations: TabItem[];
  countries: TabItem[];
  categories: TabItem[];
}

const tabLabels = [
  "Atracciones turísticas más populares",
  "Destinos más populares",
  "Países más populares",
  "Categorías más populares",
];

export const PopularTabs: React.FC<PopularTabsProps> = ({
  attractions,
  destinations,
  countries,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabData = [attractions, destinations, countries, categories];

  function getCanonicalHref(item: TabItem, tabIdx: number) {
    if (tabIdx === 0) {
      // Atracciones: construir slug canónico si hay publicCode
      if (item.slug && item.publicCode) {
        return `/attractions/${item.slug}-${item.publicCode}`;
      }
      if (item.slug && item.slug.includes('-')) {
        return `/attractions/${item.slug}`;
      }
      return item.href;
    }
    if (tabIdx === 1 || tabIdx === 2) {
      // Destinos / Países: linkear a la ruta de locations
      if (item.slug && item.publicCode) {
        return `/locations/${item.slug}-${item.publicCode}`;
      }
      if (item.slug && item.slug.includes('-')) {
        return `/locations/${item.slug}`;
      }
      return item.href;
    }
    return item.href;
  }

  return (
    <div>
      {/* Tabs: horizontal scroll on mobile, pill buttons */}
      <div className="-mx-4 mb-4 border-b">
        <div className="flex gap-3 px-4 overflow-x-auto py-3 scrollbar-hide" role="tablist" aria-label="Secciones populares">
          {tabLabels.map((label, idx) => (
            <button
              key={label}
              role="tab"
              aria-selected={activeTab === idx}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-pre rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                activeTab === idx
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-white text-slate-700 border border-transparent hover:bg-emerald-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of items: single column on xs, two on sm, four on md+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {tabData[activeTab].map((item) => (
          <a
            key={item.publicCode ?? item.slug ?? item.href}
            href={getCanonicalHref(item, activeTab)}
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <div className="truncate font-semibold text-slate-900">{item.name}</div>
              <div className="text-sm text-slate-500">{item.count} tours y actividades</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
            
