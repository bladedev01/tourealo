"use client";

import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguagePrefix } from "@/hooks/useLanguagePrefix";
import { HeroSearch } from "./HeroSearch";

export function Hero() {
  const { t } = useTranslation("frontend-home");
  const prefix = useLanguagePrefix();
  const toursHref = `${prefix}/tours`;
  const suppliersHref = `${prefix}/suppliers`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-white">
  <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:gap-16 md:py-24">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {t("badge.marketplace", "Experiences marketplace")}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("headline.title", "Book memorable tours and activities in minutes.")}
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            {t(
              "headline.subtitle",
              "Connect with vetted local suppliers, read real reviews, and secure real-time availability with instant confirmation.",
            )}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" href={toursHref}>
              {t("actions.explore", "Explore tours")}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="border border-slate-200"
              href={suppliersHref}
            >
              {t("actions.becomeSupplier", "Become a supplier")}
            </Button>
          </div>
          <div className="mt-10">
            <HeroSearch />
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-900">{t("stats.experiences.title", "+1,200 experiences")}</dt>
              <dd>{t("stats.experiences.description", "Curated by local experts across 78 destinations.")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t("stats.satisfaction.title", "99% satisfaction")}</dt>
              <dd>{t("stats.satisfaction.description", "24/7 support and flexible cancellation policies.")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t("stats.payments.title", "Secure payments")}</dt>
              <dd>{t("stats.payments.description", "Fraud protection and instant confirmation.")}</dd>
            </div>
          </dl>
        </div>
        <div className="relative flex flex-1 justify-center">
          <div className="relative aspect-[4/5] w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-center text-sm font-semibold text-emerald-700">
              {t(
                "testimonials.highlight",
                '"Booking with Tourealo was effortless. Instant confirmation and an incredibly professional guide."',
              )}
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{t("cards.catamaran.title", "Catamaran in Riviera Maya")}</p>
                <p>{t("cards.catamaran.description", "Available tomorrow - Instant confirmation")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{t("cards.foodTour.title", "Food tour in Barcelona")}</p>
                <p>{t("cards.foodTour.description", "3h - Tastings included - Spanish / English")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{t("cards.hiking.title", "Hiking in Machu Picchu")}</p>
                <p>{t("cards.hiking.description", "Free cancellation up to 48h - Certified guide")}</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-y-12 -left-10 hidden w-1 rounded-full bg-gradient-to-b from-emerald-400/0 via-emerald-400/60 to-emerald-400/0 md:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}

