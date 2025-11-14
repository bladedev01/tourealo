import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-4 text-3xl font-bold">Become a supplier</h1>
      <p className="mb-6 text-slate-700">
        Join Tourealo as a supplier and grow your business by reaching guests worldwide. We provide a
        professional platform, marketing reach, flexible payout options, and tools to manage your
        tours and availability.
      </p>

      <section className="mb-8 rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Why list with Tourealo?</h2>
        <ul className="space-y-3 text-slate-700">
          <li>
            <strong>Global visibility:</strong> your tours shown to travelers across multiple
            countries and languages.
          </li>
          <li>
            <strong>Instant bookings:</strong> real-time availability and instant confirmation to
            increase conversions.
          </li>
          <li>
            <strong>Secure payouts:</strong> multiple payout options with clear fee and payout
            reporting.
          </li>
          <li>
            <strong>Supplier dashboard:</strong> manage tours, schedules, bookings, and customer
            communication from one place.
          </li>
          <li>
            <strong>Support & trust:</strong> verification flows, insurance options, and supplier
            support to help you deliver a professional experience.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">What we ask from suppliers</h2>
        <p className="text-slate-700">
          We expect high quality listings with clear descriptions, accurate availability and fair
          pricing. Suppliers should follow local regulations and provide reliable customer service.
        </p>
      </section>

      <section className="mb-8 rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Get started</h2>
        <p className="mb-4 text-slate-700">Ready to list your tours? Create an account and follow our onboarding flow.</p>
        <div className="flex items-center gap-3">
          <Link href="/register?role=supplier" className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
            Create supplier account
          </Link>
          <Link href="/contact" className="text-sm text-slate-600 hover:underline">
            Contact sales
          </Link>
        </div>
      </section>

      <section className="text-sm text-slate-500">
        <h3 className="mb-2 font-semibold">Need a professional onboarding?</h3>
        <p>
          We can help you set up your catalogue, professional photos and optimized descriptions.
          Contact our supplier success team to learn more about tailored services and promotional
          campaigns.
        </p>
      </section>
    </main>
  );
}
