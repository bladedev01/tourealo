import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";

export interface PickupPoint {
  id: number;
  tourId: number;
  type: "hotel" | "port" | "custom";
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  portName?: string;
  portTerminal?: string;
  hotelName?: string;
  pickupRange?: string;
}

export function usePickupPoints(tourId?: string | number | null) {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tourId) return;
    setLoading(true);
    apiFetch<PickupPoint[]>(`/tours/pickup-points/by-tour/${tourId}`)
      .then(setPickupPoints)
      .catch(() => setError("No se pudieron cargar los puntos de recogida"))
      .finally(() => setLoading(false));
  }, [tourId]);

  return { pickupPoints, loading, error };
}
