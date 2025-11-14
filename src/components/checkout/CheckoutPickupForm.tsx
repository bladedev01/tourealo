import React from "react";
import type { PickupPoint } from "@/app/checkout/usePickupPoints";

export interface PickupFormValues {
  pickupOption: "hotel" | "meeting_point" | "other";
  locationName: string;
  roomNumber: string;
  notes: string;
}

interface CheckoutPickupFormProps {
  value: PickupFormValues;
  onChange: (value: PickupFormValues) => void;
  errors?: Partial<Record<keyof PickupFormValues, string>>;
  pickupPoints?: PickupPoint[];
}

const typeMap: Record<string, PickupFormValues["pickupOption"]> = {
  hotel: "hotel",
  port: "meeting_point",
  custom: "other",
};

const typeLabels: Record<PickupFormValues["pickupOption"], string> = {
  hotel: "Hotel o alojamiento",
  meeting_point: "Puerto / Punto de encuentro",
  other: "Otro / Coordinaremos luego",
};

const CheckoutPickupForm: React.FC<CheckoutPickupFormProps> = ({ value, onChange, errors, pickupPoints }) => {
  // Agrupar puntos por tipo
  const availableTypes = Array.from(new Set((pickupPoints || []).map(p => typeMap[p.type])));

  // Mostrar solo los tipos disponibles
  const handleChange = (field: keyof PickupFormValues, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  // Filtrar puntos según tipo seleccionado
  const pointsForType = (pickupPoints || []).filter(p => typeMap[p.type] === value.pickupOption);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">Selecciona el punto de recogida disponible para este tour.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {availableTypes.map((key) => {
          const active = value.pickupOption === key;
          return (
            <button
              key={key}
              type="button"
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${active ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"}`}
              onClick={() => handleChange("pickupOption", key)}
            >
              {typeLabels[key]}
            </button>
          );
        })}
      </div>
      {errors?.pickupOption && <span className="block text-xs text-rose-500">{errors.pickupOption}</span>}

      {/* Selector de punto específico si hay más de uno */}
      {pointsForType.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {value.pickupOption === "hotel"
              ? "Selecciona tu hotel"
              : value.pickupOption === "meeting_point"
              ? "Selecciona el puerto o punto de encuentro"
              : "Referencia"}
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={value.locationName}
            onChange={e => handleChange("locationName", e.target.value)}
          >
            <option value="">Selecciona una opción…</option>
            {pointsForType.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {errors?.locationName && <span className="mt-1 block text-xs text-rose-500">{errors.locationName}</span>}
        </div>
      )}

      {/* Campo manual si no hay puntos para ese tipo */}
      {pointsForType.length === 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {value.pickupOption === "hotel"
              ? "Nombre del hotel"
              : value.pickupOption === "meeting_point"
              ? "Nombre del punto de encuentro"
              : "Referencia"}
          </label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={value.locationName}
            onChange={(event) => handleChange("locationName", event.target.value)}
            placeholder={value.pickupOption === "hotel" ? "Hotel Plaza" : "Parque Central"}
          />
          {errors?.locationName && <span className="mt-1 block text-xs text-rose-500">{errors.locationName}</span>}
        </div>
      )}

      {value.pickupOption === "hotel" && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Número de habitación (opcional)</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={value.roomNumber}
            onChange={(event) => handleChange("roomNumber", event.target.value)}
            placeholder="402"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Comentarios para el guía</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          rows={3}
          value={value.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
          placeholder="Ej: viajamos con niños pequeños, llegamos 10 min antes."
        />
      </div>
    </div>
  );
};

export default CheckoutPickupForm;
