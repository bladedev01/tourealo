import { getPublicApiBase } from "@/lib/env";
import { getStoredToken } from "@/lib/auth-storage";

export type LoginResponse = {
  token?: string;
  refreshToken?: string;
  user?: any;
};

export type RegisterPayload = {
  name?: string;
  email: string;
  password: string;
  role?: string;
};

type RequestJsonInit = Omit<RequestInit, "body"> & {
  json?: any;
  body?: BodyInit | null;
};

async function requestJson<T>(path: string, init: RequestJsonInit = {}): Promise<T> {
  const base = getPublicApiBase();
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  const { json, body, headers: customHeaders, ...rest } = init;
  const headers = new Headers(customHeaders as HeadersInit | undefined);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const finalBody: BodyInit | null | undefined = json !== undefined ? JSON.stringify(json) : body ?? undefined;

  const response = await fetch(url, {
    ...rest,
    method: rest.method ?? (json !== undefined || (body !== undefined && body !== null) ? "POST" : "GET"),
    headers,
    credentials: "include",
    body: isFormData ? (body as BodyInit) : finalBody,
  });

  const text = await response.text();
  let data: any = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      void err;
    }
  }
  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.error === "string" && data.error) ||
      (data && typeof data === "object" && typeof data.message === "string" && data.message) ||
      text ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).payload = data ?? text;
    throw error;
  }
  return (data ?? (undefined as unknown)) as T;
}

export async function loginRequest(email: string, password: string, options?: { remember?: boolean; app?: string }): Promise<LoginResponse> {
  return requestJson<LoginResponse>("/auth/login", {
    json: {
      email,
      password,
      app: options?.app ?? "frontend",
    },
  });
}

export async function registerRequest(payload: RegisterPayload): Promise<any> {
  return requestJson<any>("/auth/register", {
    json: {
      ...payload,
      role: payload.role ?? "user",
    },
  });
}

export async function fetchMe(): Promise<any> {
  const token = getStoredToken();
  const headers: Record<string, string> | undefined = token
    ? { Authorization: `Bearer ${token}`, "x-access-token": token }
    : undefined;
  return requestJson<any>("/auth/me", { method: "GET", headers });
}

export async function logoutRequest(): Promise<void> {
  try {
    await requestJson("/auth/logout", { method: "POST", json: {} });
  } catch (err) {
    // backend may not implement logout endpoint; ignore failures
    void err;
  }
}
