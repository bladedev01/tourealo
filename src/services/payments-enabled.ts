import { apiFetch } from "@/lib/http";

export type PaymentsEnabled = {
  stripe: boolean;
  paypal: boolean;
  cash: boolean;
};

export async function fetchPaymentsEnabled(): Promise<PaymentsEnabled> {
  const settings = await apiFetch<any>("/settings");
  return settings.payments || { stripe: true, paypal: true, cash: false };
}
