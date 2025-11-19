"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { cancelPayment } from "@/lib/payments";

const CancelPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const cancelCalledRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (bookingId && !cancelled && !cancelCalledRef.current) {
      cancelCalledRef.current = true;
      // defer setLoading to avoid synchronous setState in effect
      timerRef.current = window.setTimeout(() => setLoading(true), 0);
      cancelPayment({ bookingId })
        .then(() => {
          setCancelled(true);
          setLoading(false);
        })
        .catch(() => {
          setError("Error cancelando el pago.");
          setLoading(false);
        });
    }
  }, [bookingId, cancelled]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {loading ? (
        <div className="text-lg">Cancelando pago PayPal...</div>
      ) : error ? (
        <>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error al cancelar el pago</h1>
          <p className="mb-2">{error}</p>
          {bookingId && <p className="mb-2 text-gray-500">Reserva #{bookingId}</p>}
          <button className="mt-4 px-6 py-2 rounded bg-red-600 text-white font-bold" onClick={() => router.push("/checkout")}>Volver al checkout</button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Pago cancelado</h1>
          <p className="mb-2">No se ha realizado el pago. Puedes intentar nuevamente o contactar soporte.</p>
          {bookingId && <p className="mb-2 text-gray-500">Reserva #{bookingId}</p>}
          <button className="mt-4 px-6 py-2 rounded bg-red-600 text-white font-bold" onClick={() => router.push("/checkout")}>Volver al checkout</button>
        </>
      )}
    </div>
  );
};

export default CancelPage;
