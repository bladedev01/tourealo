"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { confirmPaypal } from "@/lib/payments";

const SuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId") || undefined;
  const token = searchParams.get("token");
  const payerId = searchParams.get("PayerID");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (token && payerId && !confirmed && !loading) {
      // defer setLoading to avoid synchronous setState in effect
      timerRef.current = window.setTimeout(() => setLoading(true), 0);
      confirmPaypal({ bookingId, token, payerId })
        .then(() => {
          setConfirmed(true);
          setLoading(false);
        })
        .catch(() => {
          setError("Error confirmando el pago PayPal.");
          setLoading(false);
        });
    }
  }, [token, payerId, bookingId, confirmed, loading]);

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
        <div className="text-lg">Procesando pago PayPal...</div>
      ) : error ? (
        <>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error en el pago PayPal</h1>
          <p className="mb-2">{error}</p>
          {bookingId && <p className="mb-2 text-gray-500">Reserva #{bookingId}</p>}
          <button className="mt-4 px-6 py-2 rounded bg-red-600 text-white font-bold" onClick={() => router.push("/checkout")}>Volver al checkout</button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-green-600 mb-4">¡Pago realizado con éxito!</h1>
          <p className="mb-2">Tu reserva ha sido confirmada. Recibirás un email con los detalles.</p>
          {bookingId && <p className="mb-2 text-gray-500">Reserva #{bookingId}</p>}
          <button className="mt-4 px-6 py-2 rounded bg-emerald-600 text-white font-bold" onClick={() => router.push("/tours")}>Volver a tours</button>
        </>
      )}
    </div>
  );
};

export default SuccessPage;
