
import { apiFetch } from "@/lib/http";

type CheckAvailabilityParams = {
  tourId: string | number;
  date: string;
  adults: number;
  children: number;
};

export async function checkAvailability({ tourId, date, adults, children }: CheckAvailabilityParams) {
  // Construir query params para GET
  const params = new URLSearchParams({
    date,
    adults: String(adults),
    children: String(children),
  });
  return apiFetch(`/availability/tour/${tourId}/check?${params.toString()}`, {
    method: "GET",
  });
}
