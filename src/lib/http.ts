import { getPublicApiBase, getServerApiBase } from "./env";
import { getStoredToken } from "./auth-storage";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiFetchOptions = RequestInit & {
  method?: HttpMethod;
  isServer?: boolean;
  cacheTag?: string;
};

function buildUrl(path: string, base: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const hasBody = text.length > 0;
  let data: any = undefined;
  if (hasBody) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      // keep raw text if json parsing fails
      void err;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.error === "string" && data.error) ||
      (data && typeof data === "object" && typeof data.message === "string" && data.message) ||
      text ||
      `API request failed: ${response.status}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).payload = data ?? text;
    throw error;
  }

  if (!hasBody) {
    return undefined as T;
  }

  return (data ?? (text as any)) as T;
}

async function serverFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = getServerApiBase();
  const url = buildUrl(path, baseUrl);
  const { headers: getRequestHeaders } = await import("next/headers");
  const requestHeaders = await getRequestHeaders();
  const forwardHeaders = new Headers({ "Content-Type": "application/json" });

  const getHeader = (name: string) => requestHeaders?.get?.(name) ?? undefined;

  const cookieHeader = getHeader("cookie");
  if (cookieHeader) {
    forwardHeaders.set("cookie", cookieHeader);
  }

  const referer = getHeader("referer");
  if (referer) {
    forwardHeaders.set("referer", referer);
  }

  const mergedHeaders = new Headers(forwardHeaders);
  const providedHeaders = options.headers as HeadersInit | undefined;
  if (providedHeaders) {
    const custom = new Headers(providedHeaders);
    custom.forEach((value, key) => mergedHeaders.set(key, value));
  }

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
    cache: options.cache ?? "no-store",
    next: options.cacheTag ? { tags: [options.cacheTag] } : options.next,
  });

  return parseResponse<T>(response);
}

async function browserFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = getPublicApiBase();
  const url = buildUrl(path, baseUrl);
  const providedHeaders = options.headers as HeadersInit | undefined;
  const headers = new Headers(providedHeaders);
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  return parseResponse<T>(response);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  if (options.isServer || typeof window === "undefined") {
    return serverFetch<T>(path, options);
  }
  return browserFetch<T>(path, options);
}
