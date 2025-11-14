import { apiFetch } from "@/lib/http";

export interface BookingSummary {
  id: number | string;
  code?: string;
  status?: string;
  date?: string;
  startDate?: string;
  activityDate?: string;
  createdAt?: string;
  adults?: number;
  children?: number;
  totalAmount?: number;
  currency?: string;
  tour?: {
    id?: number | string;
    name?: string;
    coverImageUrl?: string;
    shortDescription?: string;
  };
  [key: string]: any;
}

export interface BookingDetail extends BookingSummary {
  persons?: number;
  pin?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  pickupTime?: string;
  language?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string;
  penaltyAmount?: number;
  refundAmount?: number;
  cancellationPolicy?: Record<string, any> | null;
  pickupPoints?: Array<Record<string, any>>;
  freeCancellationDeadline?: string | null;
  tour?: BookingSummary["tour"] & Record<string, any>;
}

export interface CancelInfoResponse {
  message?: string;
  penaltyAmount?: number;
  refundAmount?: number;
  cancellationPolicy?: Record<string, any> | null;
}

export interface PaginatedBookings {
  data: BookingSummary[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export async function fetchUserBookings(params: Record<string, any> = {}): Promise<PaginatedBookings | BookingSummary[]> {
  const query = new URLSearchParams();
  query.set("mode", "user");
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const path = `/bookings${query.toString() ? `?${query.toString()}` : ""}`;
  return apiFetch<PaginatedBookings | BookingSummary[]>(path);
}

export async function fetchCancelInfo(id: string | number): Promise<CancelInfoResponse> {
  const query = new URLSearchParams({ mode: "user" });
  return apiFetch<CancelInfoResponse>(`/bookings/${id}/cancel-info?${query.toString()}`);
}

export async function cancelBooking(id: string | number): Promise<BookingDetail | undefined> {
  const query = new URLSearchParams({ mode: "user" });
  return apiFetch<BookingDetail | undefined>(`/bookings/${id}/cancel?${query.toString()}`, {
    method: "POST",
  });
}

export async function fetchBookingByCode(code: string): Promise<BookingDetail> {
  return apiFetch<BookingDetail>(`/bookings/by-code/${encodeURIComponent(code)}`);
}

export async function fetchPublicVoucher(id: string | number, token: string): Promise<BookingDetail> {
  const query = new URLSearchParams({ token });
  return apiFetch<BookingDetail>(`/bookings/${id}/voucher-public?${query.toString()}`);
}

export interface VerifyVoucherResponse {
  ok?: boolean;
  canRedeem?: boolean;
  needPin?: boolean;
  pinInvalid?: boolean;
  redeemed?: boolean;
  booking?: BookingDetail;
  [key: string]: any;
}

export async function verifyBookingByCode(code: string, pin?: string): Promise<VerifyVoucherResponse> {
  const query = new URLSearchParams();
  if (pin) {
    query.set("pin", pin);
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<VerifyVoucherResponse>(`/bookings/verify/${encodeURIComponent(code)}${suffix}`);
}

export async function redeemBooking(id: string | number): Promise<BookingDetail> {
  return apiFetch<BookingDetail>(`/bookings/${id}/redeem`, {
    method: "POST",
  });
}
