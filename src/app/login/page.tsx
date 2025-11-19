"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useTranslation("frontend-login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  // Support both `next` and legacy `redirect` query params. Prefer `next` when present.
  const redirectTo = searchParams?.get("next") || searchParams?.get("redirect") || "/dashboard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, { remember });
      router.push(redirectTo);
    } catch (err: any) {
      setError(err?.message || t("errors.generic", "No pudimos iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full rounded-lg border px-4 py-3 pl-11 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden="true"></div>
        <div className="absolute bottom-[-5rem] right-[-3rem] h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" aria-hidden="true"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold text-white">
              T
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{t("title", "Iniciar sesión")}</h1>
            <p className="mt-2 text-sm text-slate-600">{t("subtitle", "Ingresa tus datos para gestionar tus reservas y experiencias.")}</p>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur">
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
                  {t("email", "Correo electrónico")}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                    placeholder={t("emailPlaceholder", "tu@email.com")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  {t("password", "Contraseña")}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClasses}
                    placeholder={t("passwordPlaceholder", "••••••••")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? t("hidePassword", "Ocultar contraseña") : t("showPassword", "Mostrar contraseña")}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <span className="relative inline-flex h-5 w-5 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="peer h-5 w-5 cursor-pointer rounded border border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100" />
                  </span>
                  <span>{t("remember", "Recordarme en este dispositivo")}</span>
                </label>
                <Link href="/forgot-password" className="text-emerald-600 hover:text-emerald-700">
                  {t("forgot", "¿Olvidaste tu contraseña?")}
                </Link>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading && (
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? t("loading", "Cargando...") : t("submit", "Entrar")}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              {t("noAccount", "¿Aún no tienes cuenta?")}{" "}
              <Link href="/register" className="font-semibold text-emerald-600 transition hover:text-emerald-700">
                {t("registerLink", "Crea una ahora")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
