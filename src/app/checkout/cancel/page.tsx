"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React from "react";

const CancelPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Pago cancelado</h1>
      <p className="mb-2">No se ha realizado el pago. Puedes intentar nuevamente o contactar soporte.</p>
      {bookingId && <p className="mb-2 text-gray-500">Reserva #{bookingId}</p>}
      <button
        className="mt-4 px-6 py-2 rounded bg-red-600 text-white font-bold"
        onClick={() => router.push("/checkout")}
      >
        Volver al checkout
      </button>
    </div>
  );
};

export default CancelPage;
