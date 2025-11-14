"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const SuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");
  const [loading, setLoading] = useState(false);
  // Aquí podrías hacer una llamada para obtener detalles de la reserva si lo deseas

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-3xl font-bold text-green-600 mb-4">¡Pago realizado con éxito!</h1>
      <p className="mb-2">Tu reserva ha sido confirmada. Recibirás un email con los detalles.</p>
      {bookingId && <p className="mb-2 text-gray-500">Reserva #{bookingId}</p>}
      <button
        className="mt-4 px-6 py-2 rounded bg-emerald-600 text-white font-bold"
        onClick={() => router.push("/tours")}
      >
        Volver a tours
      </button>
    </div>
  );
};

export default SuccessPage;
