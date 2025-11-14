import React, { useEffect, useState } from "react";

interface CheckoutTimerProps {
  expiresAt?: Date | null;
  onExpire?: () => void;
}

const CheckoutTimer: React.FC<CheckoutTimerProps> = ({ expiresAt, onExpire }) => {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = expiresAt.getTime() - now;
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
      if (diff <= 0 && onExpire) onExpire();
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!expiresAt) return null;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  return (
    <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
      Tiempo restante para completar la reserva: {min}:{sec.toString().padStart(2, "0")}
    </div>
  );
};

export default CheckoutTimer;
