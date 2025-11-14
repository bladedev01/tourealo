"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useTranslation("frontend-auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!name.trim()) errs.name = t("errors.nameRequired", "El nombre es obligatorio");
    if (!email.trim()) errs.email = t("errors.emailRequired", "El correo es obligatorio");
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = t("errors.emailInvalid", "Correo inválido");
    if (!password) errs.password = t("errors.passwordRequired", "La contraseña es obligatoria");
    else if (password.length < 6) errs.password = t("errors.passwordShort", "La contraseña debe tener al menos 6 caracteres");
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name, email, password }, { remember: true });
      router.push("/dashboard");
    } catch (err: any) {
      setFormError(err?.message || t("errors.generic", "Ocurrió un error"));
    } finally {
      setLoading(false);
    }
  };

  const baseInputClass =
    "w-full rounded-lg border px-4 py-3 pl-11 bg-white/95 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition";

  const withError = (hasError: boolean) =>
    hasError
      ? `${baseInputClass} border-red-400 focus:border-red-500 focus:ring-red-200`
      : `${baseInputClass} border-slate-300`;

  return (
    <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold text-white">
          ✨
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{t("registerTitle", "Crea tu cuenta")}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {t("registerSubtitle", "Explora, publica y gestiona experiencias únicas alrededor del mundo.")}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="name">
            {t("name", "Nombre completo")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true">
              <User className="h-5 w-5" />
            </span>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={withError(Boolean(fieldErrors.name))}
              placeholder={t("namePlaceholder", "Nombre y apellidos")}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              required
            />
          </div>
          {fieldErrors.name && (
            <p id="name-error" className="text-xs font-medium text-red-600">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="reg-email">
            {t("email", "Correo electrónico")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true">
              <Mail className="h-5 w-5" />
            </span>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={withError(Boolean(fieldErrors.email))}
              placeholder={t("emailPlaceholder", "tu@email.com")}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              required
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="text-xs font-medium text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="reg-password">
            {t("password", "Contraseña")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true">
              <Lock className="h-5 w-5" />
            </span>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={withError(Boolean(fieldErrors.password))}
              placeholder={t("passwordPlaceholder", "••••••••")}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
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
          {fieldErrors.password && (
            <p id="password-error" className="text-xs font-medium text-red-600">
              {fieldErrors.password}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {t("passwordHint", "Debe tener al menos 6 caracteres y combinar letras o números.")}
          </p>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
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
          {loading ? t("loading", "Creando...") : t("register", "Crear cuenta")}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-sm text-slate-600">
        <p>
          {t("termsInfo", "Al registrarte aceptas nuestras políticas de privacidad y términos de servicio.")}
        </p>
        <p>
          {t("haveAccount", "¿Ya tienes una cuenta?")}{" "}
          <Link href="/login" className="font-semibold text-emerald-600 transition hover:text-emerald-700">
            {t("backToLogin", "Inicia sesión")}
          </Link>
        </p>
      </div>
    </div>
  );
}
