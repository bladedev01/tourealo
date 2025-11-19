
"use client";
import { buildTourDisplay } from "@/lib/tour-utils";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Heart, Star, Settings2, MapPin, Clock, PlaneTakeoff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/hooks/useSettings";
import type { BookingSummary } from "@/services/bookings";
import { fetchUserBookings } from "@/services/bookings";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch (err) {
    return value ?? "-";
  }
};

const extractDate = (booking: BookingSummary): string | undefined =>
  booking.date || booking.startDate || booking.activityDate;

const isUpcoming = (booking: BookingSummary) => {
  const dateValue = extractDate(booking);
  if (!dateValue) return false;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return false;
  const now = new Date();
  return target.getTime() >= now.getTime() - 12 * 60 * 60 * 1000;
};

const applyTemplate = (template: string, replacements: Record<string, string | number>) =>
  Object.entries(replacements).reduce(
    (output, [key, value]) => output.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation("frontend-dashboard");
  const settings = useSettings();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent("/dashboard")}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setStatsLoading(true);
      setError(null);
      try {
        const result = await fetchUserBookings({ pageSize: 100 });
        if (cancelled) return;
        const items = Array.isArray((result as any)?.data)
          ? ((result as any).data as BookingSummary[])
          : Array.isArray(result)
            ? (result as BookingSummary[])
            : [];
        setBookings(items);
      } catch (err: any) {
        if (!cancelled) {
          setBookings([]);
          setError(err?.message || t("errors.load", "No pudimos cargar tus reservas"));
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, t]);

  const upcomingCount = useMemo(() => bookings.filter(isUpcoming).length, [bookings]);
  const wishlistCount = useMemo(() => Number((user as any)?.stats?.wishlist) || 0, [user]);
  const reviewsCount = useMemo(() => Number((user as any)?.stats?.reviews) || 0, [user]);

  // Solo mostrar las 2 próximas reservas en el resumen
  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(isUpcoming)
        .sort((a, b) => {
          const dateA = extractDate(a);
          const dateB = extractDate(b);
          return (dateA ? new Date(dateA).getTime() : 0) - (dateB ? new Date(dateB).getTime() : 0);
        })
        .slice(0, 2),
    [bookings],
  );

  const insights = [
    t("insightFlexible", "¿Necesitas ajustar tus planes? La mayoría de las reservas permiten cambios hasta 48 horas antes."),
    t("insightWishlist", "Mantén tu wishlist actualizada y recibe sugerencias personalizadas cada semana."),
    t("insightReviews", "Comparte reseñas después de cada viaje y desbloquea recompensas exclusivas."),
  ];

  if (loading && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" aria-hidden />
          {t("loading", "Cargando tu panel de control...")}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const brandName = settings.appName && settings.appName.trim() !== "" ? settings.appName : "Tourealo";
  const avatarUrl = user?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Traveller")}&background=10b981&color=fff`;
  const noUpcomingText = applyTemplate(
    t("noUpcoming", "Aún no tienes reservas próximas. Empieza a planificar tu siguiente experiencia con {brand}"),
    { brand: brandName },
  );
  const heroStats = [
    {
      key: "bookings",
      label: t("overviewBookings", "Próximas reservas"),
      value: statsLoading ? "…" : upcomingCount,
      icon: CalendarDays,
      bg: "from-emerald-500 to-emerald-400",
    },
    {
      key: "wishlist",
      label: t("overviewWishlist", "Experiencias guardadas"),
      value: wishlistCount,
      icon: Heart,
      bg: "from-fuchsia-500 to-pink-500",
    },
    {
      key: "reviews",
      label: t("overviewReviews", "Opiniones compartidas"),
      value: reviewsCount,
      icon: Star,
      bg: "from-amber-500 to-yellow-400",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-sky-500 text-white shadow-xl">
          <div className="absolute inset-0 opacity-20" aria-hidden>
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4)_0,_transparent_60%)]" />
          </div>
          <div className="relative flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <img src={avatarUrl} alt={user?.name || "Traveller"} className="h-20 w-20 rounded-full border-4 border-white/80 shadow-lg" />
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t("welcomeLabel", "Bienvenido de nuevo")}</p>
                <h1 className="text-3xl font-semibold sm:text-4xl">{user?.name || t("userFallback", "Viajero Tourealo")}</h1>
                <p className="text-white/80">{user?.email}</p>
                <button
                  onClick={() => router.push("/profile")}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30"
                >
                  <Settings2 className="h-4 w-4" />
                  {t("editProfile", "Actualizar perfil")}
                </button>
              </div>
            </div>
            <div className="grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              {heroStats.map(({ key, label, value, icon: Icon, bg }) => (
                <article key={key} className="overflow-hidden rounded-2xl bg-white/15 p-4 shadow-lg shadow-emerald-900/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.25em] text-white/70">{label}</span>
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${bg} text-white`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold">{value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{t("upcomingTitle", "Tus próximas aventuras")}</h2>
              {statsLoading && (
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" aria-hidden />
                  {t("loadingShort", "Actualizando...")}
                </span>
              )}
            </header>
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
            {upcomingBookings.length === 0 && !error ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center text-sm text-slate-500">
                <PlaneTakeoff className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                {noUpcomingText}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => {
                    const dateText = formatDate(extractDate(booking));
                    const createdAtText = applyTemplate(t("createdAt", "Reservado el {date}"), {
                      date: formatDate(booking.createdAt),
                    });
                    const status = String(booking.status || "").toLowerCase();
                    const badgeColor =
                      status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : status === "cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600";
                    const display = buildTourDisplay(booking.tour || {}, ((user as any)?.language || "es"));
                    const imageSrc = booking.tour?.coverImageUrl || (booking as { coverImageUrl?: string }).coverImageUrl || "https://via.placeholder.com/128x128?text=Tour";
                    return (
                      <article key={booking.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageSrc}
                              alt={display.title || t("untitledTour", "Tour sin título")}
                              className="object-cover h-16 w-16"
                              width={64}
                              height={64}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("bookingCode", "Reserva")}</p>
                            <h3 className="text-lg font-semibold text-slate-900 truncate">
                              {display.title || t("untitledTour", "Tour sin título")}
                            </h3>
                            <span className="text-xs text-slate-500">#{booking.code || booking.id}</span>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
                            {status ? status.charAt(0).toUpperCase() + status.slice(1) : t("status.unknown", "Estado desconocido")}
                          </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <CalendarDays className="h-5 w-5 text-emerald-500" />
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("when", "Cuándo")}</p>
                              <p className="font-medium text-slate-800">{dateText}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <MapPin className="h-5 w-5 text-sky-500" />
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("experience", "Experiencia")}</p>
                              <p className="font-medium text-slate-800">{display.shortDescription || display.title || t("untitledTour", "Tour sin título")}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <Clock className="h-4 w-4" />
                          {createdAtText}
                          <span className="mx-2 h-1 w-1 rounded-full bg-slate-300" aria-hidden />
                          <span>
                            {applyTemplate(t("party", "Adultos: {adults} • Niños: {children}"), {
                              adults: booking.adults ?? 0,
                              children: booking.children ?? 0,
                            })}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="pt-4 text-center">
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    onClick={() => router.push("/dashboard/bookings")}
                  >
                    {t("seeAllBookings", "Ver todas las reservas")}
                  </button>
                </div>
              </>
            )}
          </section>
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                {t("insights", "Ideas para tu siguiente viaje")}
              </h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {insights.map((tip, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-emerald-50 p-6 text-sm text-slate-700 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{t("ctaTitle", "¿Listo para tu próxima aventura?")}</h3>
              <p className="mt-2">{applyTemplate(t("ctaSubtitle", "Explora nuevas experiencias locales seleccionadas por el equipo de {brand}"), { brand: brandName })}</p>
              <button
                onClick={() => router.push("/tours")}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                {t("ctaButton", "Descubrir tours")}
              </button>
            </section>
          </aside>
        </div>
      </div>
  );
}
