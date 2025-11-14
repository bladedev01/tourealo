const pillars = [
  {
    title: "Disponibilidad en tiempo real",
    description: "Integramos inventario directo de proveedores para que reserves con confirmación inmediata y sin sorpresas.",
    icon: "🕒",
  },
  {
    title: "Confianza verificada",
    description: "Validamos proveedores, aseguramos cobertura de seguro y destacamos reseñas reales con evidencias multimedia.",
    icon: "✅",
  },
  {
    title: "Soporte proactivo 24/7",
    description: "Equipo multilingüe con seguimiento automático del viaje y resolución proactiva de incidencias.",
    icon: "💬",
  },
  {
    title: "Pagos y protección",
    description: "Pagos seguros multi-moneda, opciones BNPL y políticas de cancelación flexibles en un solo flujo.",
    icon: "🛡️",
  },
];

export function ValueProps() {
  return (
    <section className="bg-slate-900 py-16 text-slate-100">
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">Una plataforma diseñada para viajeros exigentes</h2>
          <p className="mt-3 text-sm text-slate-300">
            Tourealo combina tecnología, datos y curaduría humana para ofrecer la experiencia más confiable en tours y actividades.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner">
              <span className="text-2xl" aria-hidden>
                {pillar.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{pillar.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
