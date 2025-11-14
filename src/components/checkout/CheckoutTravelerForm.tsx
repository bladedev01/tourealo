import React from "react";

export interface TravelerFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

interface CheckoutTravelerFormProps {
  value: TravelerFormValues;
  errors?: Partial<Record<keyof TravelerFormValues, string>>;
  onChange: (value: TravelerFormValues) => void;
}

const CheckoutTravelerForm: React.FC<CheckoutTravelerFormProps> = ({ value, errors, onChange }) => {
  const handleChange = (field: keyof TravelerFormValues, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">Ingresa los datos principales del viajero a cargo de la reserva.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={value.firstName}
            onChange={(event) => handleChange("firstName", event.target.value)}
            placeholder="María"
          />
          {errors?.firstName && <span className="mt-1 block text-xs text-rose-500">{errors.firstName}</span>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Apellido</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={value.lastName}
            onChange={(event) => handleChange("lastName", event.target.value)}
            placeholder="González"
          />
          {errors?.lastName && <span className="mt-1 block text-xs text-rose-500">{errors.lastName}</span>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Correo electrónico</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={value.email}
            onChange={(event) => handleChange("email", event.target.value)}
            placeholder="maria@example.com"
          />
          {errors?.email && <span className="mt-1 block text-xs text-rose-500">{errors.email}</span>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Teléfono de contacto</label>
          <input
            type="tel"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            value={value.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            placeholder="+57 300 123 4567"
          />
          {errors?.phone && <span className="mt-1 block text-xs text-rose-500">{errors.phone}</span>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Notas o requerimientos especiales</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          rows={3}
          value={value.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
          placeholder="Indica restricciones alimentarias, movilidad, etc."
        />
      </div>
    </div>
  );
};

export default CheckoutTravelerForm;
