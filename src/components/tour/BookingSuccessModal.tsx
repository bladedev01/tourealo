import React from "react";
import { Button } from "@/components/ui/Button";

interface BookingSuccessModalProps {
  open: boolean;
  onClose: () => void;
  bookingInfo: {
    date: string;
    adults: number;
    children: number;
    priceAdult?: number;
    priceChild?: number;
    currency: string;
    tourTitle?: string;
  };
  onBookNow: () => void;
}

const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({ open, onClose, bookingInfo, onBookNow }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start bg-black/30">
      <div className="relative m-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-emerald-200 animate-fade-in-left">
        <button
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-emerald-700 mb-2">¡Hay cupos disponibles!</h2>
        <div className="mb-4 text-slate-700">
          <div className="mb-1 font-semibold">{bookingInfo.tourTitle}</div>
          <div>Fecha: <span className="font-medium">{bookingInfo.date}</span></div>
          <div>Adultos: <span className="font-medium">{bookingInfo.adults}</span></div>
          <div>Niños: <span className="font-medium">{bookingInfo.children}</span></div>
          {bookingInfo.priceAdult !== undefined && (
            <div>Precio adulto: <span className="font-medium">{bookingInfo.priceAdult} {bookingInfo.currency}</span></div>
          )}
          {bookingInfo.priceChild !== undefined && (
            <div>Precio niño: <span className="font-medium">{bookingInfo.priceChild} {bookingInfo.currency}</span></div>
          )}
        </div>
        <Button className="w-full" variant="primary" onClick={onBookNow}>
          Book now
        </Button>
      </div>
    </div>
  );
};

export default BookingSuccessModal;
