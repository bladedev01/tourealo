"use client";

import Link from "next/link";
import { useLanguagePrefix } from "@/hooks/useLanguagePrefix";
type Highlight = {
  title: string;
  location: string;
  duration: string;
  price: string;
  rating: number;
  reviews: number;
};

const highlights: Highlight[] = [
  {
    title: "Crucero al atardecer en Lisboa",
    location: "Lisboa, Portugal",
    duration: "2h",
    price: "Desde 45€",
    rating: 4.9,
    reviews: 186,
  },
  {
    title: "Clase de cocina thai con mercado local",
    location: "Bangkok, Tailandia",
    duration: "4h",
    price: "Desde 39€",
    rating: 4.8,
    reviews: 241,
  },
  {
    title: "Ruta en bicicleta por viñedos",
    location: "Mendoza, Argentina",
    duration: "3h",
    price: "Desde 55€",
    rating: 4.7,
    reviews: 132,
  },
];

export function TourHighlights() {
  const prefix = useLanguagePrefix();
  return (
    <section className="bg-white py-16">
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Selección destacada</h2>
            <p className="mt-2 text-slate-600">
              Experiencias populares con disponibilidad inmediata y cancelación flexible.
            </p>
          </div>
          <Link
            href={prefix ? `${prefix}/tours` : "/tours"}
            className="text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-500"
          >
            Ver todos los tours →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((tour) => (
            <article
              key={tour.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 via-white to-white" />
              <div className="mt-5 flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{tour.title}</h3>
                <p className="text-sm text-slate-500">{tour.location}</p>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span>{tour.duration}</span>
                  <span aria-hidden>•</span>
                  <span>{tour.price}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <span className="font-semibold">{tour.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({tour.reviews} reseñas)</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
