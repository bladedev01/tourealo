"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation("frontend-dashboard");
  const router = useRouter();

  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/dashboard/profile")}`);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        {t("profile.loginRequired", "Inicia sesión para administrar tu perfil")}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">{t("profile.title", "Información personal")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("profile.subtitle", "Actualiza tus datos y preferencias")}</p>
        <dl className="mt-6 space-y-4 text-sm text-slate-700">
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profile.name", "Nombre")}</dt>
            <dd className="text-base font-medium text-slate-900">{user.name || t("profile.unknown", "Sin nombre")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</dt>
            <dd className="text-base font-medium text-slate-900">{user.email}</dd>
          </div>
        </dl>
        <button
          className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          onClick={() => router.push("/profile")}
        >
          {t("profile.openFull", "Abrir configuración completa")}
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
        <h3 className="text-base font-semibold text-slate-900">{t("profile.security", "Seguridad")}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {t("profile.securityCopy", "Administra contraseñas, autenticación y sesiones activas desde tu perfil completo.")}
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>{t("profile.securityPasswords", "Actualiza tu contraseña regularmente")}</li>
          <li>{t("profile.securityDevices", "Cierra sesión en dispositivos que no reconozcas")}</li>
          <li>{t("profile.securityMfa", "Activa 2FA cuando esté disponible")}</li>
        </ul>
      </section>
    </div>
  );
}
