import Link from "next/link";
import CarouselTours from "@/components/tours/CarouselTours";
import type { Tour } from "@/types/tour";
import { ToursGrid } from "@/components/tours/ToursGrid";
import { TourCard } from "@/components/tours/TourCard";

// Use `ClientCarousel` for client-only carousel rendering (importing a client component
// directly from a server component is allowed). This avoids `next/dynamic({ ssr: false })`
// inside a server component which is not permitted.

type Props = {
  tours?: Tour[];
  language?: string;
  limit?: number;
  layout?: "grid" | "carousel";
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
};

/**
 * Server component that renders the most booked tours (Popular) as a grid or carousel.
 * IMPORTANT: this component DOES NOT perform HTTP requests itself. Fetch data in a
 * server/page layer or a `src/services` helper and pass `tours` as a prop. This keeps
 * concerns separated, simplifies testing and makes caching explicit.
 */
export default function PopularTours({
  tours,
  language,
  limit = 8,
  layout = "grid",
  title = "Populares",
  subtitle = "Los tours más reservados por nuestros clientes.",
  showHeader = true,
}: Props) {
  const list: Tour[] = tours || [];

  if (!list || !list.length) {
    return <p className="text-sm text-slate-500">No se encontraron tours populares.</p>;
  }

  const prefix = language ? `/${language}` : "";

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
          renderItem={(t: Tour) => <TourCard key={t.id} tour={t} language={language || ""} />}
        />
      ) : (
        <ToursGrid tours={list} language={language || ""} />
      )}
    </section>
  );
}
