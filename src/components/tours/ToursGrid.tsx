import type { Tour } from "@/types/tour";
import { TourCard } from "./TourCard";

export function ToursGrid({ tours, language }: { tours: Tour[]; language: string }) {
  if (!tours.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No encontramos tours disponibles en este momento. Ajusta tus filtros o vuelve a intentarlo más tarde.
      </p>
    );
  }
  return (
    <div className="mx-auto w-full grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {tours.map((tour) => (
        <TourCard key={String(tour.id)} tour={tour} language={language} />
      ))}
    </div>
  );
}

