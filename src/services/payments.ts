import { apiFetch } from "@/lib/http";
import { getStoredToken } from "@/lib/auth-storage";

export type PaymentInitPayload = {
  bookingId: string | number;
  amount?: number;
  currency?: string;
  email?: string;
};

export type InitiateCheckoutPayload = {
  paymentMethod: "stripe" | "paypal" | "cash" | string;
  tourId: string | number;
  date: string;
  adults: number;
  children: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  language?: string;
  notes?: string;
  preferences?: string;
  pickupLocationId?: string | number;
  pickupTime?: string;
};

export async function createStripeSession(payload: PaymentInitPayload): Promise<{ url?: string }> {
  const token = getStoredToken();
  return apiFetch("/payments/create-stripe-session", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}`, "x-access-token": token } : undefined,
  });
}

export async function createPaypalOrder(payload: PaymentInitPayload): Promise<{ approvalUrl?: string }> {
  const token = getStoredToken();
  return apiFetch("/payments/create-paypal-order", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}`, "x-access-token": token } : undefined,
  });
}

export async function initiateCheckout(payload: InitiateCheckoutPayload): Promise<{ bookingId: number | string; redirectUrl?: string; cancellationDeadline?: string }> {
  const token = getStoredToken();
  return apiFetch("/checkout/initiate", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}`, "x-access-token": token } : undefined,
  });
}
