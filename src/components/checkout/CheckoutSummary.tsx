import React from "react";
import { CalendarDays, Users, Baby, Star } from "lucide-react";

interface CheckoutSummaryProps {
  tourName?: string;
  date?: string;
  adults?: string | number;
  children?: string | number;
  coverImageUrl?: string;
  shortDescription?: string;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  tourName,
  date,
  adults,
  children,
  coverImageUrl,
  shortDescription,
}) => {
  const safeDate = date ?? "Por definir";
  const safeAdults = adults ?? "—";
  const safeChildren = children ?? "—";

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg shadow-emerald-100/40">
      <div className="relative h-56 w-full">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={tourName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500 text-emerald-50">
            <span className="text-sm font-semibold uppercase tracking-[0.3em]">Tourealo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/80">Experiencia seleccionada</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{tourName}</h2>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>4.8</span>
            <span className="text-emerald-500">(1.2k)</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 pb-6 pt-5">
        <p className="text-sm leading-relaxed text-slate-600">
          {shortDescription || "Prepárate para una experiencia inolvidable descubriendo los rincones más especiales del destino."}
        </p>

        <div className="grid grid-cols-1 gap-3 rounded-2xl bg-emerald-50/60 p-4 text-sm text-slate-700">
          <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm">
            <CalendarDays className="h-4.5 w-4.5 text-emerald-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600">Fecha</p>
              <p className="text-sm font-semibold text-slate-800">{safeDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm">
            <Users className="h-4.5 w-4.5 text-emerald-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600">Adultos</p>
              <p className="text-sm font-semibold text-slate-800">{safeAdults}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm">
            <Baby className="h-4.5 w-4.5 text-emerald-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600">Niños</p>
              <p className="text-sm font-semibold text-slate-800">{safeChildren}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutSummary;
