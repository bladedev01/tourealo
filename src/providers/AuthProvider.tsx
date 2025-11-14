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
  // Avoid reading storage during initial render to prevent SSR hydration mismatches.
  // Bootstrap of stored session happens in the effect below.
  const [user, setUser] = useState<User>(() => initialUser ?? null);
  const [loading, setLoading] = useState<boolean>(true);

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
      } else {
        // No stored token — attempt to detect cookie-based session by calling fetchMe()
        // This allows servers that use HttpOnly session cookies to keep the user logged in
        try {
          // call fetchMe to detect cookie session
          const me = await fetchMe();
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.debug("[AuthProvider] fetchMe result", { me });
          }
          if (me) {
            if (active) {
              setUser(me);
              // persist user locally so UI can bootstrap next time
              storeAuthSession({ user: me });
              storeUserProfile(me);
            }
          } else if (!session.user) {
            // no cookie session and no stored user -> clear any partial storage
            clearAuthStorage();
            setUser(null);
          }
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.debug("[AuthProvider] fetchMe error", err);
          }
          if (!session.user) {
            clearAuthStorage();
            setUser(null);
          }
        }
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
