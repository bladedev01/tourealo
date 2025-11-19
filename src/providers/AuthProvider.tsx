"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest, registerRequest, fetchMe, logoutRequest } from "@/services/auth";
import {
  clearAuthStorage,
  hasStoredSession,
  loadStoredSession,
  storeAuthSession,
  storeUserProfile,
} from "@/lib/auth-storage";

type UserStats = Record<string, number | string | undefined> | undefined;

type User = {
  id: number;
  name?: string;
  email?: string;
  photo?: string;
  stats?: UserStats;
} | null;

type LoginOptions = {
  remember?: boolean;
  app?: string;
};

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string, options?: LoginOptions) => Promise<User>;
  register: (payload: { email: string; password: string; name?: string }, options?: LoginOptions) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: User }) {
  // Initialize user synchronously on the client from stored session so the
  // UI (header / layouts) can render the correct state immediately and
  // avoid flashes before the client effect runs.
  const [user, setUser] = useState<User>(() => {
    try {
      if (typeof window !== "undefined") {
        const session = loadStoredSession();
        return session?.user ?? initialUser ?? null;
      }
    } catch (err) {
      // ignore read errors and fall back to initialUser
    }
    return initialUser ?? null;
  });

  // Only show a loading state when we have a token that needs refreshing.
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const session = loadStoredSession();
        return Boolean(session?.token);
      }
    } catch (err) {
      // if reading fails, be conservative and set loading to false
    }
    return false;
  });

  const refresh = useCallback(async () => {
    if (!hasStoredSession()) {
      setUser(null);
      return null;
    }
    try {
      const me = await fetchMe();
      if (me) {
        setUser(me);
        storeAuthSession({ user: me });
        storeUserProfile(me);
      } else {
        setUser(null);
      }
      return me ?? null;
    } catch (err) {
      clearAuthStorage();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      if (initialUser) {
        if (active) {
          setUser(initialUser);
          storeUserProfile(initialUser);
          setLoading(false);
        }
        return;
      }
      // Bootstrap from stored session (localStorage token) to avoid
      // relying on server-side cookies. This keeps behavior consistent
      // with the original auth flow and avoids cookie-based assumptions.
      const session = loadStoredSession();
      if (process.env.NODE_ENV !== "production") {
        // helpful debug while troubleshooting cookie/token-based sessions
        // eslint-disable-next-line no-console
        console.debug("[AuthProvider] bootstrap session", { token: session.token, user: session.user });
      }
      if (session.user && active) {
        setUser(session.user);
      }
      if (session.token) {
        // token-based session: refresh user from API
        await refresh();
      } else if (!session.user) {
        // no cookie session and no stored user -> clear any partial storage
        clearAuthStorage();
        setUser(null);
      }
      if (active) {
        setLoading(false);
      }
    };
    bootstrap().catch(() => {
      if (active) {
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [initialUser, refresh]);

  const login = useCallback(
    async (email: string, password: string, options?: LoginOptions) => {
      setLoading(true);
      try {
        const response = await loginRequest(email, password, { app: options?.app ?? "frontend" });
        const remember = Boolean(options?.remember);
        storeAuthSession({
          token: response.token ?? null,
          refreshToken: response.refreshToken ?? null,
          user: response.user ?? null,
          remember,
        });
        if (response.user) {
          setUser(response.user);
          storeUserProfile(response.user);
          return response.user;
        }
        const me = await refresh();
        return me;
      } catch (err) {
        clearAuthStorage();
        setUser(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const register = useCallback(
    async (payload: { email: string; password: string; name?: string }, options?: LoginOptions) => {
      await registerRequest(payload);
      return login(payload.email, payload.password, options);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      void err;
    }
    clearAuthStorage();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
