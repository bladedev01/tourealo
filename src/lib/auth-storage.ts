const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";
const REMEMBER_KEY = "authRemember";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getStorage(type: "local" | "session"): Storage | null {
  if (!isBrowser()) return null;
  try {
    const storage = type === "local" ? window.localStorage : window.sessionStorage;
    const testKey = "__auth_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch (err) {
    console.warn("[auth-storage] Storage unavailable", { type, err });
    return null;
  }
}

function safeSet(storage: Storage | null, key: string, value: string | null) {
  if (!storage) return;
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch (err) {
    console.warn("[auth-storage] Failed to persist key", { key, err });
  }
}

function safeGet(storage: Storage | null, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (err) {
    console.warn("[auth-storage] Failed to read key", { key, err });
    return null;
  }
}

function resolvePrimaryStorage(remember?: boolean): Storage | null {
  if (!isBrowser()) return null;
  if (remember === true) return getStorage("local");
  if (remember === false) return getStorage("session");
  const local = getStorage("local");
  const session = getStorage("session");
  const localRemember = safeGet(local, REMEMBER_KEY);
  if (localRemember === "1") return local;
  const sessionRemember = safeGet(session, REMEMBER_KEY);
  if (sessionRemember === "1") return session;
  if (safeGet(local, TOKEN_KEY)) return local;
  if (safeGet(session, TOKEN_KEY)) return session;
  return local ?? session;
}

function resolveSecondaryStorage(primary: Storage | null): Storage | null {
  if (!isBrowser()) return null;
  const local = getStorage("local");
  const session = getStorage("session");
  if (!primary) {
    if (local && session && local === session) return null;
    return local ?? session;
  }
  return primary === local ? session : local;
}

export type StoredSession = {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  remember: boolean;
};

export function storeAuthSession(args: { token?: string | null; refreshToken?: string | null; user?: any; remember?: boolean }) {
  if (!isBrowser()) return;
  const primary = resolvePrimaryStorage(args.remember);
  const secondary = resolveSecondaryStorage(primary);
  if (!primary) return;
  if (args.token !== undefined) {
    safeSet(primary, TOKEN_KEY, args.token ?? null);
    safeSet(secondary, TOKEN_KEY, null);
  }
  if (args.refreshToken !== undefined) {
    safeSet(primary, REFRESH_TOKEN_KEY, args.refreshToken ?? null);
    safeSet(secondary, REFRESH_TOKEN_KEY, null);
  }
  if (args.user !== undefined) {
    const serialized = args.user == null ? null : JSON.stringify(args.user);
    safeSet(primary, USER_KEY, serialized);
    safeSet(secondary, USER_KEY, null);
  }
  safeSet(primary, REMEMBER_KEY, args.remember ? "1" : "0");
  safeSet(secondary, REMEMBER_KEY, null);
}

export function storeUserProfile(user: any) {
  if (!isBrowser()) return;
  const primary = resolvePrimaryStorage(undefined);
  const serialized = user == null ? null : JSON.stringify(user);
  safeSet(primary, USER_KEY, serialized);
}

export function clearAuthStorage() {
  if (!isBrowser()) return;
  const local = getStorage("local");
  const session = getStorage("session");
  safeSet(local, TOKEN_KEY, null);
  safeSet(local, REFRESH_TOKEN_KEY, null);
  safeSet(local, USER_KEY, null);
  safeSet(local, REMEMBER_KEY, null);
  safeSet(session, TOKEN_KEY, null);
  safeSet(session, REFRESH_TOKEN_KEY, null);
  safeSet(session, USER_KEY, null);
  safeSet(session, REMEMBER_KEY, null);
}

export function getStoredToken(): string | null {
  if (!isBrowser()) return null;
  return safeGet(getStorage("local"), TOKEN_KEY) || safeGet(getStorage("session"), TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return safeGet(getStorage("local"), REFRESH_TOKEN_KEY) || safeGet(getStorage("session"), REFRESH_TOKEN_KEY);
}

export function getStoredUser<T = any>(): T | null {
  if (!isBrowser()) return null;
  const raw = safeGet(getStorage("local"), USER_KEY) || safeGet(getStorage("session"), USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("[auth-storage] Failed to parse stored user", err);
    return null;
  }
}

export function loadStoredSession(): StoredSession {
  if (!isBrowser()) {
    return { token: null, refreshToken: null, user: null, remember: false };
  }
  const local = getStorage("local");
  const session = getStorage("session");
  const token = safeGet(local, TOKEN_KEY) || safeGet(session, TOKEN_KEY);
  const refreshToken = safeGet(local, REFRESH_TOKEN_KEY) || safeGet(session, REFRESH_TOKEN_KEY);
  const rawUser = safeGet(local, USER_KEY) || safeGet(session, USER_KEY);
  let user: any = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch (err) {
      console.warn("[auth-storage] Failed to parse stored user", err);
    }
  }
  const rememberFlag = safeGet(local, REMEMBER_KEY) || safeGet(session, REMEMBER_KEY);
  return {
    token: token ?? null,
    refreshToken: refreshToken ?? null,
    user: user ?? null,
    remember: rememberFlag === "1",
  };
}

export function hasStoredSession(): boolean {
  if (!isBrowser()) return false;
  return Boolean(getStoredToken());
}
