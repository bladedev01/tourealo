"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { checkAvailability } from "@/services/availability";
import BookingSuccessModal from "./BookingSuccessModal";
import { useRouter } from "next/navigation";

interface TourBookingSectionProps {
  price: number;
  currency: string;
  isAvailable: boolean;
  contactHref: string;
  tourId?: string | number;
  groupMin?: number;
  groupMax?: number;
}

const TourBookingSection: React.FC<TourBookingSectionProps> = ({ price, currency, isAvailable, contactHref, tourId, groupMin = 1, groupMax = 20 }) => {
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<null | { available: boolean; message: string; priceAdult?: number; priceChild?: number }>();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  const totalGuests = adults + children;

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setAvailability(null);
    try {
      if (!tourId) throw new Error("No tourId");
      const res: any = await checkAvailability({ tourId, date, adults, children });
      setAvailability({
        available: res.available,
        message: res.message || (res.available ? "¡Hay cupos disponibles!" : "No hay disponibilidad para la fecha seleccionada."),
        priceAdult: res.data?.priceAdult ?? res.priceAdult,
        priceChild: res.data?.priceChild ?? res.priceChild,
      });
      if (res.available) {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setAvailability({ available: false, message: err.message || "No se pudo consultar la disponibilidad." });
    } finally {
      setChecking(false);
    }
  };

  const handleBookNow = () => {
    // Puedes pasar los datos por query o state según tu flujo
    const params = new URLSearchParams({
      tourId: String(tourId),
      date,
      adults: String(adults),
      children: String(children),
    });
    router.push(`/checkout?${params.toString()}`);
    setShowSuccessModal(false);
  };

  const showPrice = availability && availability.available && (availability.priceAdult || availability.priceChild);

  return (
    <>
      <BookingSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        bookingInfo={{
          date,
          adults,
          children,
          priceAdult: availability?.priceAdult,
          priceChild: availability?.priceChild,
          currency,
        }}
        onBookNow={handleBookNow}
      />
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-4">
          <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Desde</div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {showPrice
              ? `${availability?.priceAdult ?? price} ${currency}`
              : `${price} ${currency}`}
          </div>
          <div className="text-xs text-slate-500">por adulto</div>
          {showPrice && availability?.priceChild !== undefined && (
            <div className="text-xs text-slate-500 mt-1">{`Niño: ${availability.priceChild} ${currency}`}</div>
          )}
        </div>
        <form className="space-y-4" onSubmit={handleCheckAvailability}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="date-input">Fecha</label>
            <input
              id="date-input"
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-700 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="adults-input">Adultos</label>
              <input
                id="adults-input"
                type="number"
                min={groupMin}
                max={groupMax}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-700 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="children-input">Niños</label>
              <input
                id="children-input"
                type="number"
                min={0}
                max={groupMax}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-700 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={children}
                onChange={e => setChildren(Number(e.target.value))}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={checking} variant="primary">
            {checking ? "Comprobando..." : "Comprobar disponibilidad"}
          </Button>
        </form>
        {availability && (
          <div className={`mt-4 rounded-lg border px-3 py-2 text-sm font-semibold ${availability.available ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"}`}>
            {availability.message}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href={contactHref} variant="secondary">
            Hablar con un asesor
          </Button>
        </div>
      </section>
    </>
  );
}

export default TourBookingSection;
