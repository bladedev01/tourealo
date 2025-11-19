import Link from "next/link";
import { Briefcase, Users, ShieldCheck, Mail } from "lucide-react";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold">Partner with Tourealo</h1>
        <p className="mx-auto max-w-2xl text-slate-700">Grow your business with our trusted marketplace — professional onboarding, marketing reach and reliable payouts.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/register?role=supplier" className="rounded-md bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700">
            Create supplier account
          </Link>
          <Link href="/contact" className="text-sm text-slate-600 hover:underline">
            Contact sales
          </Link>
        </div>
      </header>

      <section className="mb-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Professional tools</h3>
              <p className="text-sm text-slate-700">Manage tours, availability and bookings with an easy-to-use dashboard.</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Global reach</h3>
              <p className="text-sm text-slate-700">Show your tours to travelers across multiple countries and languages.</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Trust & support</h3>
              <p className="text-sm text-slate-700">Verification flows and supplier support to help you deliver a professional experience.</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Dedicated onboarding</h3>
              <p className="text-sm text-slate-700">We help with photos, descriptions and campaigns to maximize visibility.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="text-sm text-slate-500">
        <h3 className="mb-2 font-semibold">Ready to start?</h3>
        <p className="mb-4">Create a supplier account and follow our onboarding flow. We’ll be in touch to help you publish professional listings.</p>
        <div className="flex items-center gap-3">
          <Link href="/register?role=supplier" className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
            Create supplier account
          </Link>
          <Link href="/contact" className="text-sm text-slate-600 hover:underline">
            Contact sales
          </Link>
        </div>
      </section>
    </main>
  );
}
