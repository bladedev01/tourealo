"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import { useLanguagePrefix } from "@/hooks/useLanguagePrefix";
import type { BookingSummary } from "@/services/bookings";
import {
  cancelBooking,
  fetchCancelInfo,
  fetchUserBookings,
  type CancelInfoResponse,
} from "@/services/bookings";

const applyTemplate = (template: string, replacements: Record<string, string | number>) =>
  Object.entries(replacements).reduce(
    (output, [key, value]) => output.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );

type ConfirmState = {
  id: string | number;
  info: CancelInfoResponse;
};

type ExpandedState = string | number | null;

type ActionState = string | number | null;

type LoadingState = "idle" | "list" | "cancel";

export default function BookingsPage() {
  const { t } = useTranslation("frontend-booking-list");
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const prefix = useLanguagePrefix();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState<LoadingState>("idle");
  const [actionLoading, setActionLoading] = useState<ActionState>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [expandedId, setExpandedId] = useState<ExpandedState>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;
    let cancelled = false;
    const load = async () => {
      setLoading("list");
      setError(null);
      try {
        const response = await fetchUserBookings({ lang: language });
        if (cancelled) return;
        const list = Array.isArray((response as any)?.data)
          ? ((response as any).data as BookingSummary[])
          : Array.isArray(response)
            ? (response as BookingSummary[])
            : [];
        setBookings(list);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || t("errors.load", "No pudimos cargar tus reservas"));
        }
      } finally {
        if (!cancelled) {
          setLoading("idle");
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, language, t]);

  const canViewVoucher = useMemo(() => {
    if (!user) return false;
    const role = String((user as any)?.role || "").toLowerCase();
    return role === "user" || role === "supplier" || role === "admin";
  }, [user]);

  const onToggleExpanded = (id: string | number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const onRequestCancelInfo = async (id: string | number) => {
    setActionLoading(id);
    setError(null);
    try {
      const info = await fetchCancelInfo(id);
      setConfirmState({ id, info });
    } catch (err: any) {
      setError(err?.message || t("errors.cancelInfo", "No pudimos obtener la información de cancelación"));
    } finally {
      setActionLoading(null);
    }
  };

  const onCancelBooking = async (id: string | number) => {
    setActionLoading(id);
    setError(null);
    try {
      await cancelBooking(id);
      setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status: "cancelled" } : booking)));
      setConfirmState(null);
    } catch (err: any) {
      setError(err?.message || t("errors.cancel", "No pudimos cancelar la reserva"));
    } finally {
      setActionLoading(null);
    }
  };

  const onChangeData = (id: string | number) => {
    router.push(`${prefix}/bookings/${id}/edit`);
  };

  const onViewVoucher = (code?: string) => {
    if (!code) return;
    router.push(`${prefix}/voucher/${encodeURIComponent(code)}`);
  };

  const onPayBooking = (id: string | number) => {
    router.push(`${prefix}/checkout?bookingId=${id}`);
  };

  if (!authLoading && !user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">{t("loginToView", "Inicia sesión para ver tus reservas")}</h1>
          <p className="text-sm text-slate-600">
            {t("loginHint", "Necesitas una cuenta activa para consultar, editar o cancelar tus reservas confirmadas.")}
          </p>
          <button
            onClick={() => router.push(`${prefix}/login?redirect=${encodeURIComponent("/bookings")}`)}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            {t("loginCta", "Ir a iniciar sesión")}
          </button>
        </div>
      </div>
    );
  }

  const renderStatusBadge = (status?: string) => {
    const normalized = String(status || "").toLowerCase();
    const base = "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold capitalize";
    if (normalized === "confirmed" || normalized === "completed") {
      return <span className={`${base} bg-emerald-100 text-emerald-700`}>{normalized || "confirmed"}</span>;
    }
    if (normalized === "pending") {
      return <span className={`${base} bg-amber-100 text-amber-700`}>{normalized}</span>;
    }
    if (normalized === "cancelled") {
      return <span className={`${base} bg-rose-100 text-rose-700`}>{normalized}</span>;
    }
    return <span className={`${base} bg-slate-100 text-slate-600`}>{normalized || t("status.unknown", "Desconocido")}</span>;
  };

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto w-full max-w-6xl px-4">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t("title", "Mis reservas")}</h1>
            <p className="text-sm text-slate-600">
              {t("subtitle", "Consulta tus reservas confirmadas, gestiona cambios y descarga tus datos de acceso.")}
            </p>
          </div>
        </header>

        {loading === "list" ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" aria-hidden />
              {t("loading", "Cargando tus reservas")}
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80">
            <div className="text-center text-sm text-slate-500">
              {t("noBookings", "No encontramos reservas asociadas a tu cuenta.")}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="hidden bg-slate-100/80 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 sm:grid sm:grid-cols-[minmax(220px,2fr)_repeat(5,minmax(120px,1fr))_minmax(140px,1fr)]">
              <span className="px-5 py-4 text-left">{t("columns.tour", "Tour")}</span>
              <span className="px-5 py-4 text-left">{t("columns.date", "Fecha")}</span>
              <span className="px-5 py-4 text-left">{t("columns.persons", "Personas")}</span>
              <span className="px-5 py-4 text-left">{t("columns.code", "Código")}</span>
              <span className="px-5 py-4 text-left">{t("columns.pin", "PIN")}</span>
              <span className="px-5 py-4 text-left">{t("columns.payment", "Pago")}</span>
              <span className="px-5 py-4 text-left">{t("columns.actions", "Acciones")}</span>
            </div>
            <div className="divide-y divide-slate-200">
              {bookings.map((booking) => {
                const bookingId = booking.id ?? booking.code ?? Math.random().toString();
                const tourData = booking.tour as any;
                const tourTranslations = Array.isArray(tourData?.translations) ? tourData.translations : undefined;
                const bookingTitle =
                  tourData?.name ||
                  (tourTranslations && tourTranslations[0]?.title) ||
                  (tourTranslations && tourTranslations[0]?.name) ||
                  (booking as any)?.tourTitle ||
                  t("tourFallback", "Tour sin título");
                const bookingDate = booking.date || booking.startDate || booking.activityDate || "";
                const normalizedDate = bookingDate ? String(bookingDate).slice(0, 10) : "-";
                const totalPersons = Number(booking.persons ?? 0) || (Number(booking.adults ?? 0) + Number(booking.children ?? 0));
                const personLabel = applyTemplate(t("personsLabel", "{count} viajeros"), {
                  count: totalPersons || 0,
                });
                const expanded = expandedId === bookingId;
                const statusBadge = renderStatusBadge(booking.status);
                const isCancelled = String(booking.status || "").toLowerCase() === "cancelled";

                return (
                  <div key={bookingId} className="flex flex-col">
                    <div
                      className={`grid cursor-pointer items-center gap-4 px-4 py-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(220px,2fr)_repeat(5,minmax(120px,1fr))_minmax(140px,1fr)] ${isCancelled ? "opacity-60" : ""}`}
                      onClick={() => onToggleExpanded(bookingId)}
                    >
                      <div className="flex items-center gap-3">
                        {booking.tour?.coverImageUrl ? (
                          <Image
                            src={booking.tour.coverImageUrl}
                            alt={bookingTitle}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                            {t("imagePlaceholder", "Sin imagen")}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 line-clamp-2" title={bookingTitle}>
                            {bookingTitle}
                          </span>
                          <span className="text-xs text-slate-500">{statusBadge}</span>
                        </div>
                      </div>
                      <span className="hidden text-sm text-slate-600 sm:block">{normalizedDate}</span>
                      <span className="hidden text-sm text-slate-600 sm:block">{personLabel}</span>
                      <span className="hidden font-mono text-xs text-slate-500 sm:block">{booking.code || "-"}</span>
                      <span className="hidden font-mono text-xs text-slate-500 sm:block">{booking.pin || "-"}</span>
                      <span className="hidden text-sm text-slate-600 sm:block">{booking.paymentMethod || "-"}</span>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        >
                          {expanded ? t("actions.hide", "Ocultar detalles") : t("actions.show", "Ver detalles")}
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-6">
                        <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-inner">
                          <div className="flex flex-col gap-6 lg:flex-row">
                            <div className="flex w-full flex-col gap-4 lg:max-w-sm">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                  {t("details.summary", "Resumen")}
                                </h3>
                                <dl className="mt-3 space-y-2 text-sm text-slate-600">
                                  <div className="flex items-center justify-between">
                                    <dt>{t("columns.code", "Código")}</dt>
                                    <dd className="font-mono text-xs">{booking.code || "-"}</dd>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <dt>{t("columns.pin", "PIN")}</dt>
                                    <dd className="font-mono text-xs">{booking.pin || "-"}</dd>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <dt>{t("columns.payment", "Pago")}</dt>
                                    <dd className="text-sm font-medium text-slate-700">{booking.paymentMethod || "-"}</dd>
                                  </div>
                                </dl>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                  {t("details.contact", "Contacto")}
                                </h3>
                                <dl className="mt-3 space-y-2 text-sm text-slate-600">
                                  <div className="flex items-center justify-between">
                                    <dt>{t("details.name", "Nombre")}</dt>
                                    <dd className="text-right font-medium text-slate-700">{booking.contactName || "-"}</dd>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <dt>{t("details.email", "Email")}</dt>
                                    <dd className="font-mono text-xs text-right">{booking.contactEmail || "-"}</dd>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <dt>{t("details.phone", "Teléfono")}</dt>
                                    <dd className="font-mono text-xs text-right">{booking.contactPhone || "-"}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
                                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.date", "Fecha")}</span>
                                  <span className="mt-1 font-semibold text-slate-800">{normalizedDate}</span>
                                </div>
                                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
                                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.people", "Personas")}</span>
                                  <span className="mt-1 font-semibold text-slate-800">
                                    {applyTemplate(t("details.peopleBreakdown", "Adultos: {adults} · Niños: {children}"), {
                                      adults: booking.adults ?? 0,
                                      children: booking.children ?? 0,
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.payment", "Pago y cancelación")}</span>
                                  <dl className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <dt>{t("details.paymentMethod", "Método")}</dt>
                                      <dd className="font-medium text-slate-800">{booking.paymentMethod || "-"}</dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <dt>{t("details.penalty", "Penalidad")}</dt>
                                      <dd className="font-mono text-xs">
                                        {typeof booking.penaltyAmount === "number"
                                          ? `$${booking.penaltyAmount.toFixed(2)}`
                                          : "-"}
                                      </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <dt>{t("details.refund", "Reembolso")}</dt>
                                      <dd className="font-mono text-xs">
                                        {typeof booking.refundAmount === "number"
                                          ? `$${booking.refundAmount.toFixed(2)}`
                                          : "-"}
                                      </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <dt>{t("details.totalPaid", "Total pagado")}</dt>
                                      <dd className="font-semibold text-emerald-600">
                                        {typeof booking.totalAmount === "number" && booking.currency
                                          ? `${booking.totalAmount.toFixed(2)} ${booking.currency}`
                                          : booking.totalAmount || "-"}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.policy", "Política de cancelación")}</span>
                                  <p className="mt-2 text-sm text-slate-600">
                                    {booking.cancellationPolicy?.name || booking.cancellationPolicy?.title || t("details.policyUnknown", "Sin información disponible")}
                                  </p>
                                </div>
                              </div>
                              {booking.notes && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("details.notes", "Notas")}</span>
                                  <p className="mt-2 whitespace-pre-line">{booking.notes}</p>
                                </div>
                              )}
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                                  onClick={() => onChangeData(bookingId)}
                                >
                                  {t("actions.change", "Cambiar datos")}
                                </button>
                                {canViewVoucher && booking.code && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                    onClick={() => onViewVoucher(booking.code)}
                                  >
                                    {t("actions.voucher", "Ver voucher")}
                                  </button>
                                )}
                                {String(booking.paymentStatus || "").toLowerCase() === "pending" && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                    onClick={() => onPayBooking(bookingId)}
                                  >
                                    {t("actions.pay", "Pagar ahora")}
                                  </button>
                                )}
                                {String(booking.paymentMethod || "").toLowerCase() === "cash" && String(booking.paymentStatus || "").toLowerCase() === "pending" && (
                                  <span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700">
                                    {t("actions.cash", "Pago en destino")}
                                  </span>
                                )}
                              </div>
                              {isCancelled ? null : (
                                <div className="mt-4">
                                  {confirmState && confirmState.id === bookingId ? (
                                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
                                      <h4 className="text-base font-semibold text-amber-800">
                                        {t("confirm.title", "¿Seguro que quieres cancelar?")}
                                      </h4>
                                      <p className="mt-1 text-sm text-amber-700">
                                        {confirmState.info?.message || t("confirm.subtitle", "Revisa la penalidad y el reembolso antes de confirmar.")}
                                      </p>
                                      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                                        <div>
                                          <dt className="text-xs uppercase tracking-[0.3em] text-amber-600">{t("confirm.penalty", "Penalidad")}</dt>
                                          <dd className="font-mono text-base text-amber-800">
                                            ${Number(confirmState.info?.penaltyAmount || 0).toFixed(2)}
                                          </dd>
                                        </div>
                                        <div>
                                          <dt className="text-xs uppercase tracking-[0.3em] text-amber-600">{t("confirm.refund", "Reembolso")}</dt>
                                          <dd className="font-mono text-base text-emerald-700">
                                            ${Number(confirmState.info?.refundAmount || 0).toFixed(2)}
                                          </dd>
                                        </div>
                                        <div>
                                          <dt className="text-xs uppercase tracking-[0.3em] text-amber-600">{t("confirm.policy", "Política")}</dt>
                                          <dd className="font-semibold text-amber-800">
                                            {confirmState.info?.cancellationPolicy?.name || confirmState.info?.cancellationPolicy?.id || "-"}
                                          </dd>
                                        </div>
                                      </dl>
                                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                                          onClick={() => onCancelBooking(bookingId)}
                                          disabled={actionLoading === bookingId}
                                        >
                                          {actionLoading === bookingId
                                            ? t("confirm.processing", "Cancelando...")
                                            : t("confirm.action", "Confirmar cancelación")}
                                        </button>
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-300"
                                          onClick={() => setConfirmState(null)}
                                        >
                                          {t("confirm.dismiss", "Volver")}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                                      onClick={() => onRequestCancelInfo(bookingId)}
                                      disabled={actionLoading === bookingId}
                                    >
                                      {actionLoading === bookingId
                                        ? t("actions.loading", "Procesando...")
                                        : t("actions.cancel", "Cancelar reserva")}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {error && (
                          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                            {error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
