export function getSiteOrigin(): string {
  // Usa la variable pública configurada en entorno para construir URLs canónicas
  // Fallback para entorno de desarrollo si no está definida
  return process.env.NEXT_PUBLIC_SITE_URL || "https://tourealo.dev";
}

export default getSiteOrigin;
const SERVER_API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// Determine the public API base in a tolerant way so builds don't fail
// if environment variables are not configured in the build environment (e.g. Vercel settings).
let PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!PUBLIC_API_BASE && process.env.NEXT_PUBLIC_SITE_URL) {
  PUBLIC_API_BASE = `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/api`;
}

if (!PUBLIC_API_BASE) {
  // Last-resort fallback to the canonical production API. It's better to set the
  // `NEXT_PUBLIC_API_BASE_URL` in your Vercel project settings, but this prevents
  // build-time crashes and provides a reasonable default.
  PUBLIC_API_BASE = "https://api.tourealo.com/api";
  // Use console.warn so the message appears in build logs without failing the build.
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set. Falling back to https://api.tourealo.com/api.\nSet the env var in Vercel project settings to avoid this message.");
}

export function getPublicApiBase() {
  return PUBLIC_API_BASE!.replace(/\/$/, "");
}

export function getServerApiBase() {
  const base = SERVER_API_BASE || PUBLIC_API_BASE;
  if (!base) {
    throw new Error("API base URL is not configured. Set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL.");
  }
  return base.replace(/\/$/, "");
}
