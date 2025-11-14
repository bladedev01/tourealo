export const I18N_NAMESPACES = [
  "frontend-common",
  "frontend-navbar",
  "frontend-home",
  "frontend-dashboard",
  "frontend-profile",
  "frontend-tours",
  "frontend-tour-detail",
  "frontend-booking-list",
  "frontend-booking-detail",
  "frontend-book-tour",
  "frontend-categories",
  "frontend-tags",
  "frontend-search-results",
  "frontend-login",
  "frontend-become-supplier",
  "frontend-auth",
  "frontend-footer",
] as const;

export const DEFAULT_NAMESPACE = "frontend-common";

export type TranslationNamespace = (typeof I18N_NAMESPACES)[number];

export function isKnownNamespace(value: string): value is TranslationNamespace {
  return (I18N_NAMESPACES as readonly string[]).includes(value);
}
