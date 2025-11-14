const SERVER_API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!PUBLIC_API_BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be defined. Update your environment configuration.");
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
