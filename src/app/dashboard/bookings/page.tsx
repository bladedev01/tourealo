"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import {
  BookingSummary,
  CancelInfoResponse,
  cancelBooking,
  fetchCancelInfo,
  fetchUserBookings,
} from "@/services/bookings";
import { buildTourDisplay } from "@/lib/tour-utils";
import { useTranslation } from "@/hooks/useTranslation";

const statusTokens: Record<string, { className: string; tone: string }> = {
  confirmed: { className: "bg-emerald-100 text-emerald-700 border-emerald-200", tone: "positive" },
  pending: { className: "bg-amber-100 text-amber-700 border-amber-200", tone: "warning" },
  cancelled: { className: "bg-rose-100 text-rose-700 border-rose-200", tone: "negative" },
};

const fallbackImage = "https://via.placeholder.com/128x128?text=Tour";

const primaryDate = (booking: BookingSummary) => booking.date || booking.startDate || booking.activityDate;

const formatDate = (value?: string | null, locale?: string) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale ?? undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch (err) {
    void err;
    return value ?? "—";
  }
};

const formatDateTime = (value?: string | null, locale?: string) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale ?? undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (err) {
    void err;
    return value ?? "—";
  }
};

const formatCurrency = (value?: number | null, currency?: string, locale?: string) => {
  if (value === undefined || value === null) return "—";
  try {
    return new Intl.NumberFormat(locale ?? undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(value);
  } catch (err) {
    void err;
    return `${value.toFixed(2)} ${currency ?? ""}`.trim();
  }
};

const statusIconByTone: Record<string, React.ComponentType<{ className?: string }>> = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  negative: AlertTriangle,
};

const getPersons = (booking: BookingSummary) => {
  const adults = booking.adults ?? 0;
  const children = booking.children ?? 0;
  const persons = (booking as { persons?: number }).persons;
  return {
    adults,
    children,
    total: persons ?? adults + children,
  };
};

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useTranslation("frontend-booking-list");
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelInfo, setCancelInfo] = useState<CancelInfoResponse | null>(null);
  const [cancelInfoLoading, setCancelInfoLoading] = useState(false);
  const [cancelInfoError, setCancelInfoError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);

  useEffect(() => {
    // Do not attempt to load bookings when there's no authenticated user.
    if (!user) {
      setBookings([]);
      setSelectedBooking(null);
      setLoading(false);
      return;
    }

    let aborted = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchUserBookings({ pageSize: 100 });
        if (aborted) return;
        const collection = Array.isArray((response as { data?: BookingSummary[] })?.data)
          ? (response as { data: BookingSummary[] }).data
          : Array.isArray(response)
            ? (response as BookingSummary[])
            : [];
        setBookings(collection);
        setSelectedBooking((prev) => prev ?? collection[0] ?? null);
      } catch (err: unknown) {
        if (!aborted) {
          const message = err instanceof Error ? err.message : String(err ?? "");
          setError(message || t("errors.load", "No pudimos cargar tus reservas"));
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      aborted = true;
    };
  }, [t, user]);

  // Redirect to login if auth finished and there's no user
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/dashboard/bookings")}`);
    }
  }, [authLoading, user, router]);

  // Avoid rendering the full bookings UI while unauthenticated — prevents a flash
  if (authLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        {t("loading", "Cargando reservas...")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        {t("loginRequired", "Inicia sesión para ver tus reservas")}
      </div>
    );
  }

  useEffect(() => {
    setCancelInfo(null);
    setCancelInfoError(null);
  }, [selectedBooking?.id]);

  const upcomingCount = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      const baseDate = primaryDate(booking);
      if (!baseDate) return acc;
      const target = new Date(baseDate);
      if (Number.isNaN(target.getTime())) return acc;
      return target.getTime() >= Date.now() - 12 * 60 * 60 * 1000 ? acc + 1 : acc;
    }, 0);
  }, [bookings]);

  const handleSelect = (booking: BookingSummary) => {
    setSelectedBooking(booking);
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const handleRequestCancelInfo = async (booking: BookingSummary) => {
    if (!booking.id) return;
    setCancelInfoLoading(true);
    setCancelInfoError(null);
    try {
      const info = await fetchCancelInfo(booking.id);
      setCancelInfo(info);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? "");
      setCancelInfoError(message || t("errors.cancelInfo", "No pudimos obtener la información de cancelación"));
    } finally {
      setCancelInfoLoading(false);
    }
  };

  const handleConfirmCancel = async (booking: BookingSummary) => {
    if (!booking.id) return;
    setCancellingId(booking.id);
    try {
      await cancelBooking(booking.id);
      setBookings((prev) => prev.map((item) => (item.id === booking.id ? { ...item, status: "cancelled" } : item)));
      setSelectedBooking((prev) => (prev?.id === booking.id ? { ...prev, status: "cancelled" } : prev));
      setCancelInfo(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? "");
      alert(message || t("errors.cancel", "No pudimos cancelar la reserva. Intenta nuevamente."));
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        {t("loading", "Cargando reservas...")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600">
        {error}
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <CalendarDays className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="text-lg font-semibold text-slate-900">{t("empty.title", "Aún no tienes reservas")}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("empty.subtitle", "Explora nuestra selección de tours y agenda tu próxima experiencia.")}
        </p>
        <button
          onClick={() => handleNavigate("/tours")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          {t("empty.cta", "Descubrir tours")}
        </button>
      </div>
    );
  }

  const status = String(selectedBooking?.status || "").toLowerCase();
  const token = statusTokens[status] ?? { className: "bg-slate-100 text-slate-600 border-slate-200", tone: "neutral" };
  const StatusIcon = statusIconByTone[token.tone] ?? CheckCircle2;
  const persons = selectedBooking ? getPersons(selectedBooking) : { adults: 0, children: 0, total: 0 };
  const currency = selectedBooking?.currency || "USD";
  const coverImage = selectedBooking?.tour?.coverImageUrl || (selectedBooking as { coverImageUrl?: string })?.coverImageUrl || fallbackImage;
  const voucherCode = selectedBooking && typeof selectedBooking.code === 'string' && selectedBooking.code.trim() !== '' ? selectedBooking.code : undefined;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{t("breadcrumb", "Panel de usuario")}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{t("title", "Mis reservas")}</h1>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
          {t("upcomingCount", "{count} próximas", { count: upcomingCount })}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            {t("list.title", "Historial de reservas")}
          </h2>
          <div className="space-y-3">
            {bookings.map((booking) => {
              const bookingStatus = String(booking.status || "").toLowerCase();
              const badge = statusTokens[bookingStatus] ?? token;
              const badgeIcon = statusIconByTone[badge.tone] ?? CheckCircle2;
              const bookingDate = formatDate(primaryDate(booking), language);
              const isActive = selectedBooking?.id === booking.id;
              const totalGuests = getPersons(booking).total;
              // Usar buildTourDisplay para obtener el título y shortDescription robustos
              const display = buildTourDisplay(booking.tour || {}, language);
              const imageSrc = booking.tour?.coverImageUrl || (booking as { coverImageUrl?: string }).coverImageUrl || fallbackImage;
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => handleSelect(booking)}
                  className={`relative flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition hover:border-emerald-200 hover:shadow-md ${isActive ? "border-emerald-400 bg-emerald-50/60 shadow-sm" : "border-slate-200 bg-white"}`}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <Image
                      src={imageSrc}
                      alt={display.title || t("list.noTitle", "Tour sin título")}
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {display.title || t("list.noTitle", "Tour sin título")}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                        {React.createElement(badgeIcon, { className: "h-3 w-3" })}
                        {(booking.status || "").toString() || t("status.unknown", "Estado desconocido")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {bookingDate}
                      </span>
                      {display.shortDescription && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {display.shortDescription}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {t("list.guests", "{count} personas", { count: totalGuests })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                      <span>{t("list.code", "Código")} #{booking.code || booking.id}</span>
                      {booking.paymentStatus && <span>{booking.paymentStatus}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {!selectedBooking ? (
            <p className="text-sm text-slate-500">{t("details.empty", "Selecciona una reserva para ver sus detalles.")}</p>
          ) : (
            <>
              {(() => {
                const display = buildTourDisplay(selectedBooking.tour || {}, language);
                return (
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-sky-500 p-6 text-white shadow">
                    <div className="absolute inset-0 opacity-20" aria-hidden>
                      <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4)_0,_transparent_70%)]" />
                    </div>
                    <div className="relative flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/60">
                          <Image src={coverImage} alt={display.title || "Tour"} fill unoptimized sizes="64px" className="object-cover" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t("details.label", "Reserva seleccionada")}</p>
                          <h2 className="text-2xl font-semibold leading-tight">{display.title || t("list.noTitle", "Tour sin título")}</h2>
                          <p className="mt-1 text-sm text-white/80">#{selectedBooking.code || selectedBooking.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(primaryDate(selectedBooking), language)}
                        </span>
                        {selectedBooking.createdAt && (
                          <span className="inline-flex items-center gap-2 text-white/80">
                            <Clock className="h-4 w-4" />
                            {t("details.createdAt", "Reservado el {date}", { date: formatDateTime(selectedBooking.createdAt, language) })}
                          </span>
                        )}
                      </div>
                      <span className={`relative inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${token.className}`}>
                        <StatusIcon className="h-4 w-4" />
                        {(selectedBooking.status || "").toString() || t("status.unknown", "Estado desconocido")}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {t("details.summary", "Resumen de la reserva")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <Hash className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.codes", "Códigos")}</p>
                        <p className="font-semibold text-slate-900">{t("details.bookingCode", "Reserva")} #{selectedBooking.code || selectedBooking.id}</p>
                        <p className="text-xs text-slate-500">PIN: {(selectedBooking as { pin?: string }).pin || "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <Users className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.guests", "Participantes")}</p>
                        <p className="font-semibold text-slate-900">{t("details.totalGuests", "Total: {count}", { count: persons.total })}</p>
                        <p className="text-xs text-slate-500">
                          {t("details.adults", "Adultos: {count}", { count: persons.adults })} · {t("details.children", "Niños: {count}", { count: persons.children })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <User className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.contact", "Contacto principal")}</p>
                        <p className="font-semibold text-slate-900">{(selectedBooking as { contactName?: string }).contactName || t("details.noName", "Sin nombre")}</p>
                        <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />{(selectedBooking as { contactEmail?: string }).contactEmail || "—"}
                        </p>
                        {(selectedBooking as { contactPhone?: string }).contactPhone && (
                          <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />{(selectedBooking as { contactPhone?: string }).contactPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <CreditCard className="h-5 w-5 text-emerald-500" />
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.payment", "Pago")}</p>
                        <p className="font-semibold text-slate-900">{(selectedBooking as { paymentMethod?: string }).paymentMethod || "—"}</p>
                        <p className="text-xs text-slate-500">{(selectedBooking as { paymentStatus?: string }).paymentStatus || "—"}</p>
                        {(selectedBooking as { paymentReference?: string }).paymentReference && (
                          <p className="text-xs text-slate-500">{t("details.reference", "Referencia")} {(selectedBooking as { paymentReference?: string }).paymentReference}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.cancellation", "Cancelación")}</p>
                        <p className="font-semibold text-slate-900">{formatCurrency((selectedBooking as { penaltyAmount?: number }).penaltyAmount, currency, language)}</p>
                        <p className="text-xs text-slate-500">{t("details.refund", "Reembolso")} {formatCurrency((selectedBooking as { refundAmount?: number }).refundAmount, currency, language)}</p>
                        {(selectedBooking as { freeCancellationDeadline?: string }).freeCancellationDeadline && (
                          <p className="text-xs text-slate-500">
                            {t("details.freeCancellation", "Sin penalidad hasta {date}", {
                              date: formatDate((selectedBooking as { freeCancellationDeadline?: string }).freeCancellationDeadline, language),
                            })}
                          </p>
                        )}
                        {(selectedBooking as { cancellationPolicy?: { name?: string; id?: string } | null }).cancellationPolicy && (
                          <p className="text-xs text-slate-500">
                            {t("details.policy", "Política aplicada")}: {(selectedBooking as { cancellationPolicy?: { name?: string; id?: string } | null }).cancellationPolicy?.name || (selectedBooking as { cancellationPolicy?: { name?: string; id?: string } | null }).cancellationPolicy?.id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <MapPin className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.pickup", "Punto de encuentro")}</p>
                        {(selectedBooking as { pickupPoints?: Array<Record<string, unknown>> })?.pickupPoints?.length ? (
                          <ul className="mt-2 space-y-1 text-xs text-slate-500">
                            {(selectedBooking as { pickupPoints?: Array<{ name?: string; address?: string; instructions?: string }> }).pickupPoints?.map((point, index) => (
                              <li key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="font-semibold text-slate-800">{point.name || t("details.pickupPoint", "Punto de recogida")}</p>
                                {point.address && <p>{point.address}</p>}
                                {point.instructions && <p className="text-[11px] text-slate-500">{point.instructions}</p>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500">{t("details.noPickup", "La experiencia no requiere punto de encuentro específico.")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t("actions.title", "Acciones rápidas")}</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleNavigate(`/bookings/${selectedBooking.id}/edit`)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                  >
                    <User className="h-4 w-4" />
                    {t("actions.edit", "Cambiar datos")}
                  </button>
                  {voucherCode && (
                    <button
                      onClick={() => handleNavigate(`/voucher/${encodeURIComponent(voucherCode)}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {t("actions.voucher", "Ver voucher")}
                    </button>
                  )}
                  {(selectedBooking as { paymentStatus?: string }).paymentStatus === "pending" && (
                    <button
                      onClick={() => handleNavigate(`/checkout?bookingId=${selectedBooking.id}`)}
                      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                    >
                      <CreditCard className="h-4 w-4" />
                      {t("actions.payNow", "Pagar ahora")}
                    </button>
                  )}
                  {status !== "cancelled" && (
                    <button
                      onClick={() => handleRequestCancelInfo(selectedBooking)}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                      disabled={cancelInfoLoading}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {cancelInfoLoading ? t("actions.requesting", "Calculando penalidad...") : t("actions.cancel", "Cancelar reserva")}
                    </button>
                  )}
                </div>
                {cancelInfoError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {cancelInfoError}
                  </div>
                )}
                {cancelInfo && status !== "cancelled" && (
                  <div className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-5 w-5" />
                      <strong>{t("cancelInfo.title", "Confirma cancelación")}</strong>
                    </div>
                    {cancelInfo.message && <p>{cancelInfo.message}</p>}
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-sm text-amber-900">
                        <p className="text-xs uppercase tracking-[0.25em] text-amber-500">{t("cancelInfo.penalty", "Penalidad")}</p>
                        <p className="font-semibold">{formatCurrency(cancelInfo.penaltyAmount, currency, language)}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-emerald-700">
                        <p className="text-xs uppercase tracking-[0.25em] text-emerald-500">{t("cancelInfo.refund", "Reembolso")}</p>
                        <p className="font-semibold">{formatCurrency(cancelInfo.refundAmount, currency, language)}</p>
                      </div>
                    </div>
                    {cancelInfo.cancellationPolicy && (
                      <p className="text-xs text-amber-700">
                        {t("cancelInfo.policy", "Política aplicada")}: {cancelInfo.cancellationPolicy?.name || cancelInfo.cancellationPolicy?.id}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleConfirmCancel(selectedBooking)}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                        disabled={cancellingId === selectedBooking.id}
                      >
                        {cancellingId === selectedBooking.id ? t("cancelInfo.cancelling", "Cancelando...") : t("cancelInfo.confirm", "Confirmar cancelación")}
                      </button>
                      <button
                        onClick={() => setCancelInfo(null)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                      >
                        {t("cancelInfo.dismiss", "Mantener reserva")}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
