import React from "react";

interface TourBookingWidgetProps {
  price: number;
  currency: string;
  onBook: () => void;
  isAvailable: boolean;
}

const TourBookingWidget: React.FC<TourBookingWidgetProps> = ({ price, currency, onBook, isAvailable }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow flex flex-col gap-3">
      <div className="text-2xl font-bold">
        {price} {currency}
      </div>
      <button
        className="btn btn-primary w-full disabled:opacity-60"
        onClick={onBook}
        disabled={!isAvailable}
      >
        {isAvailable ? "Reservar ahora" : "No disponible"}
      </button>
    </div>
  );
};

export default TourBookingWidget;
