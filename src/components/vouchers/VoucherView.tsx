"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as QRCode from "qrcode";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  fetchBookingByCode,
  fetchPublicVoucher,
  type BookingDetail,
} from "@/services/bookings";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CalendarDays,
  Users,
  ClipboardCopy,
  Clock,
  ShieldCheck,
  MapPin,
  Phone,
  CircleDollarSign,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";

export type VoucherViewProps = {
  code: string;
};

type VoucherState = {
  booking: BookingDetail | null;
  loading: boolean;
  error: string | null;
  qrUrl: string | null;
};

const STORAGE_PREFIX = "voucher_token_";

export function VoucherView({ code }: VoucherViewProps) {
  const { t } = useTranslation("frontend-voucher");
  // Helper to format translations with simple {placeholders}
  const fmt = (key: string, defaultValue: string, vars?: Record<string, any>) => {
    const template = t(key, defaultValue);
    if (!vars) return template;
    return String(template).replace(/\{(\w+)\}/g, (_m, name) => {
      const v = vars[name];
      return v === undefined || v === null ? "" : String(v);
    });
  };
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VoucherState>({ booking: null, loading: true, error: null, qrUrl: null });
  const [copyKey, setCopyKey] = useState<string | null>(null);

  const storageKey = `${STORAGE_PREFIX}${code}`;

  const tokenFromParams = useMemo(() => {
    const token = searchParams.get("token") || searchParams.get("t");
    return token || null;
  }, [searchParams]);

  useEffect(() => {
    let token = tokenFromParams;
    if (token) {
      try {
        sessionStorage.setItem(storageKey, token);
        const cleanPath = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanPath);
      } catch (error) {
        console.warn("Failed to persist voucher token", error);
      }
    } else {
      try {
        token = sessionStorage.getItem(storageKey);
      } catch (error) {
        console.warn("Failed to read stored voucher token", error);
      }
    }

    let ignore = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        let booking: BookingDetail;
        if (token) {
          try {
            const payloadPart = token.split(".")[1];
            const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
            const decoded = JSON.parse(atob(normalized));
            const bookingId = decoded?.bookingId;
            if (!bookingId) throw new Error("Token sin bookingId");
            booking = await fetchPublicVoucher(String(bookingId), token);
          } catch (error) {
            throw new Error(t("errors.invalidToken", "Token inválido"));
          }
        } else {
          booking = await fetchBookingByCode(code);
        }
        if (ignore) return;
        setState({ booking, loading: false, error: null, qrUrl: null });
      } catch (error: any) {
        if (ignore) return;
        setState({ booking: null, loading: false, error: error?.message || t("errors.load", "No se pudo cargar la reserva"), qrUrl: null });
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [code, storageKey, t, tokenFromParams]);

  useEffect(() => {
    if (!state.booking?.code) return;
    let cancelled = false;
    const generate = async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${origin}/v/${state.booking?.code}`;
        const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 });
        if (!cancelled) {
          setState((prev) => ({ ...prev, qrUrl: dataUrl }));
        }
      } catch (error) {
        console.warn("Failed to generate QR", error);
      }
    };
    void generate();
    return () => {
      cancelled = true;
    };
  }, [state.booking?.code]);

  const onCopy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyKey(key);
      setTimeout(() => setCopyKey(null), 1500);
    } catch (error) {
      console.warn("Clipboard copy failed", error);
    }
  }, []);

  const printMode = searchParams.get("print") === "1";

  const statusBadge = useMemo(() => {
    const status = String(state.booking?.status || "").toLowerCase();
    if (status === "confirmed") return { label: t("status.confirmed", "Confirmada"), className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    if (status === "completed") return { label: t("status.completed", "Completada"), className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    if (status === "pending") return { label: t("status.pending", "Pendiente"), className: "bg-amber-100 text-amber-800 border-amber-200" };
    if (status === "cancelled") return { label: t("status.cancelled", "Cancelada"), className: "bg-rose-100 text-rose-800 border-rose-200" };
    return { label: status || t("status.unknown", "Desconocido"), className: "bg-slate-100 text-slate-700 border-slate-200" };
  }, [state.booking?.status, t]);

  const personsLabel = useMemo(() => {
    const adults = Number(state.booking?.adults ?? 0);
    const children = Number(state.booking?.children ?? 0);
    const total = Number(state.booking?.persons ?? adults + children);
    const chunks = [total ? `${total} ${t("details.people.total", "personas")}` : null];
    if (adults) chunks.push(`${adults} ${t("details.people.adults", "adultos")}`);
    if (children) chunks.push(`${children} ${t("details.people.children", "niños")}`);
    return chunks.filter(Boolean).join(" · ");
  }, [state.booking, t]);

  const tourTranslation = useMemo(() => {
    const translations = state.booking?.tour?.translations;
    if (!Array.isArray(translations)) return null;
    const normalizedLanguage = state.booking?.language?.toLowerCase?.();
    if (normalizedLanguage) {
      const match = translations.find((item) => item?.language?.toLowerCase?.() === normalizedLanguage);
      if (match) return match;
    }
    return translations[0] ?? null;
  }, [state.booking]);

  if (state.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" aria-hidden />
          {t("state.loading", "Cargando voucher...")}
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-lg">
          <TriangleAlert className="mx-auto h-10 w-10 text-rose-500" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-rose-600">{t("errors.title", "No se pudo cargar el voucher")}</h1>
          <p className="mt-2 text-sm text-slate-600">{state.error}</p>
          <button
            onClick={() => router.push("/bookings")}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            {t("actions.viewBookings", "Ver mis reservas")}
          </button>
        </div>
      </div>
    );
  }

  if (!state.booking) {
    return null;
  }

  const booking = state.booking;
  const verifyUrl = `/v/${booking.code}`;
  const bookingDate = booking.date ? new Date(booking.date) : null;
  const highlightsHtml = tourTranslation?.highlights;
  const itineraryHtml = tourTranslation?.itinerary;
  const includedHtml = tourTranslation?.included;
  const notIncludedHtml = tourTranslation?.notIncluded;

  return (
    <div className="bg-slate-50 py-10" data-voucher-ready="1" data-print={printMode ? "1" : "0"}>
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative h-24 w-32 overflow-hidden rounded-2xl border border-slate-200">
                {booking.tour?.coverImageUrl ? (
                  <Image
                    src={booking.tour.coverImageUrl}
                    alt={booking.tour?.name || "Tour"}
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-slate-500">{t("details.noImage", "Sin imagen")}</div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-slate-900">{tourTranslation?.title || booking.tour?.name || booking.productTitle || t("details.title", "Reserva")}</h1>
                <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                  {statusBadge.label}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {booking.code && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
                  <span className="font-semibold text-slate-700">{t("details.code", "Código")}:</span>
                  <span className="font-mono">{booking.code}</span>
                  <button onClick={() => onCopy(booking.code ?? "", "code")} className="text-slate-500 transition hover:text-slate-700" type="button">
                    <ClipboardCopy className="h-4 w-4" />
                  </button>
                  {copyKey === "code" && <span className="text-xs text-emerald-600">{t("actions.copied", "Copiado")}</span>}
                </div>
              )}
              {booking.pin && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
                  <span className="font-semibold text-slate-700">PIN:</span>
                  <span className="font-mono">{booking.pin}</span>
                  <button onClick={() => onCopy(booking.pin ?? "", "pin")} className="text-slate-500 transition hover:text-slate-700" type="button">
                    <ClipboardCopy className="h-4 w-4" />
                  </button>
                  {copyKey === "pin" && <span className="text-xs text-emerald-600">{t("actions.copied", "Copiado")}</span>}
                </div>
              )}
            </div>
          </header>

          <section className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <CalendarDays className="mt-1 h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.date", "Fecha")}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {bookingDate
                        ? bookingDate.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <Users className="mt-1 h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.persons", "Personas")}</p>
                    <p className="text-sm font-semibold text-slate-900">{personsLabel}</p>
                  </div>
                </div>
                {booking.pickupTime && (
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <Clock className="mt-1 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.pickup", "Hora de recogida")}</p>
                      <p className="text-sm font-semibold text-slate-900">{booking.pickupTime}</p>
                    </div>
                  </div>
                )}
                {booking.language && (
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <ShieldCheck className="mt-1 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.language", "Idioma")}</p>
                      <p className="text-sm font-semibold text-slate-900">{booking.language.toUpperCase?.() || booking.language}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("details.customer", "Datos del cliente")}</h2>
                <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.name", "Nombre")}</dt>
                    <dd className="mt-1 font-medium">{booking.contactName || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Email</dt>
                    <dd className="mt-1 font-mono text-xs">{booking.contactEmail || "-"}</dd>
                  </div>
                  {booking.contactPhone && (
                    <div>
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.phone", "Teléfono")}</dt>
                      <dd className="mt-1 font-mono text-xs">{booking.contactPhone}</dd>
                    </div>
                  )}
                  {booking.notes && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.notes", "Notas")}</dt>
                      <dd className="mt-1 whitespace-pre-line text-sm text-slate-600">{booking.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {highlightsHtml && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("details.highlights", "Puntos destacados")}</h2>
                  <div
                    className="prose prose-sm mt-3 max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: highlightsHtml }}
                  />
                </div>
              )}

              {itineraryHtml && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("details.itinerary", "Itinerario")}</h2>
                  <div
                    className="prose prose-sm mt-3 max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: itineraryHtml }}
                  />
                </div>
              )}

              {includedHtml || notIncludedHtml ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {includedHtml && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("details.included", "Incluye")}</h2>
                      <div
                        className="prose prose-sm mt-3 max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: includedHtml }}
                      />
                    </div>
                  )}
                  {notIncludedHtml && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("details.notIncluded", "No incluye")}</h2>
                      <div
                        className="prose prose-sm mt-3 max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: notIncludedHtml }}
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {booking.pickupPoints && booking.pickupPoints.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("details.pickupPoints", "Puntos de encuentro")}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {booking.pickupPoints.map((point, index) => {
                      const latitude = (point as any)?.latitude;
                      const longitude = (point as any)?.longitude;
                      const mapsUrl =
                        latitude != null && longitude != null
                          ? `https://www.google.com/maps?q=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
                          : null;
                      return (
                        <li key={String(point.id ?? index)} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-4 w-4 text-emerald-500" />
                            <div>
                              <p className="font-semibold text-slate-900">{point.name || t("details.pickupUnnamed", "Punto de encuentro")}</p>
                              {point.address && <p className="text-xs text-slate-500">{point.address}</p>}
                              <div className="mt-1 text-xs text-slate-500">
                                {point.hotelName && <span>Hotel: {point.hotelName} · </span>}
                                {point.portName && <span>Puerto: {point.portName} {point.portTerminal ? `- ${point.portTerminal}` : ""} · </span>}
                                {point.pickupRange && <span>Área: {point.pickupRange}</span>}
                              </div>
                              {mapsUrl && (
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center text-xs font-semibold text-emerald-600 hover:underline"
                                >
                                  {t("details.viewMap", "Ver en Google Maps")}
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {booking.cancellationPolicy && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("details.policy", "Política de cancelación")}</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    {booking.cancellationPolicy?.title || booking.cancellationPolicy?.name || t("details.policyUnknown", "Sin información disponible")}
                  </p>
                  {Array.isArray((booking.cancellationPolicy as any)?.refundTiers) && (
                    <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
                      {(booking.cancellationPolicy as any).refundTiers.map((tier: any, index: number) => {
                        const percent = tier?.percent ?? tier?.refundPercent ?? tier?.refund_percent;
                        const hoursBefore = tier?.hoursBefore;
                        const unit = tier?.unit;
                        const value = tier?.value ?? tier?.amount ?? tier?.qty;
                        if (typeof hoursBefore === "number") {
                          return (
                            <li key={index}>{fmt("policy.hoursBefore", "Hasta {hours} horas antes: reembolso {percent}%", { hours: hoursBefore, percent: percent ?? 0 })}</li>
                          );
                        }
                        if (unit && value != null) {
                          return (
                            <li key={index}>{fmt("policy.unit", "Hasta {value} {unit} antes: reembolso {percent}%", { value, unit, percent: percent ?? 0 })}</li>
                          );
                        }
                        if (percent != null) {
                          return <li key={index}>{fmt("policy.percent", "Reembolso {percent}% según condiciones", { percent })}</li>;
                        }
                        return <li key={index}>{fmt("policy.generic", "Consulta las condiciones de reembolso")}</li>;
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("verify.title", "Verificación rápida")}</h2>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="grid h-36 w-36 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {state.qrUrl ? (
                      <Image src={state.qrUrl} alt={t("verify.qrAlt", "Código QR de verificación")} width={144} height={144} />
                    ) : (
                      <span className="text-xs text-slate-500">{t("verify.generating", "Generando QR...")}</span>
                    )}
                  </div>
                  <a href={verifyUrl} className="text-xs font-semibold text-emerald-600 hover:underline">
                    {t("verify.link", "Verificar código")}
                  </a>
                  <p className="text-center text-[11px] text-slate-500">{t("verify.hint", "Escanea para validar y canjear en el punto de encuentro.")}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("provider.title", "Proveedor")}</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-1 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("provider.emergency", "Teléfono de emergencia")}</p>
                      <p className="font-semibold text-slate-800">{booking.tour?.emergencyPhone || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("provider.name", "Proveedor")}</p>
                      <p className="font-semibold text-slate-800">
                        {booking.tour?.supplier?.company_name || booking.tour?.supplier?.name || "-"}
                      </p>
                    </div>
                  </div>
                  {booking.tour?.supplier?.phone && <p className="text-xs text-slate-500">{booking.tour.supplier.phone}</p>}
                  {booking.tour?.supplier?.email && <p className="text-xs text-slate-500">{booking.tour.supplier.email}</p>}
                  {booking.tour?.supplier?.website_url && (
                    <a
                      href={booking.tour.supplier.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      {t("provider.website", "Sitio web")}
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("payment.title", "Resumen de pago")}</h2>
                <div className="mt-3 flex items-start gap-3">
                  <CircleDollarSign className="mt-1 h-4 w-4 text-slate-500" />
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{booking.totalAmount} {booking.currency}</p>
                    {booking.paymentMethod && (
                      <p className="text-xs text-slate-500">
                        {t("payment.method", "Método")}: {booking.paymentMethod}
                        {booking.paymentReference ? ` · Ref: ${booking.paymentReference}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {booking.freeCancellationDeadline && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-800">
                  <CheckCircle2 className="mb-2 h-5 w-5" aria-hidden />
                  {fmt("details.freeCancelUntil", "Cancelación gratis hasta: {date}", {
                    date: new Date(booking.freeCancellationDeadline).toLocaleString(),
                  })}
                </div>
              )}
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}
