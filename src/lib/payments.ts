import { getPublicApiBase } from "./env";

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export async function confirmPaypal({ bookingId, token, payerId }: { bookingId?: string; token: string; payerId: string }) {
  const jwt = getToken();
  const res = await fetch(`${getPublicApiBase()}/payments/paypal/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
    },
    credentials: "include",
    body: JSON.stringify({ bookingId, token, payerId }),
  });
  if (!res.ok) throw new Error("Error confirmando el pago PayPal");
  return res.json();
}

export async function cancelPayment({ bookingId }: { bookingId: string }) {
  const jwt = getToken();
  const res = await fetch(`${getPublicApiBase()}/payments/cancel-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
    },
    credentials: "include",
    body: JSON.stringify({ bookingId, paymentMethod: "paypal" }),
  });
  if (!res.ok) throw new Error("Error cancelando el pago");
  return res.json();
}
