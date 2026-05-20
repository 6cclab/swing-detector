import React, { createContext, useContext, useEffect, useState } from "react";
import { apiPatch, apiPost } from "./api";
import { getToken, removeToken, setToken } from "./auth";

export type User = {
  id: string;
  email: string;
  name: string;
  handedness: string;
  notifications: boolean;
  camera_angle: string;
  units: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    handedness?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<Pick<User, "notifications" | "camera_angle" | "units" | "name" | "handedness">>) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          try {
            const { apiGet } = await import("./api");
            const u = await apiGet<User>("/api/auth/me");
            setUser(u);
          } catch {
            await removeToken();
          }
        }
      } catch {
        // secure store or network error — continue as logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiPost<{ access_token: string; user: User }>(
      "/api/auth/login",
      { email, password }
    );
    await setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    handedness = "right"
  ) => {
    const res = await apiPost<{ access_token: string; user: User }>(
      "/api/auth/register",
      { email, password, name, handedness }
    );
    await setToken(res.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  const updatePreferences = async (prefs: Partial<Pick<User, "notifications" | "camera_angle" | "units" | "name" | "handedness">>) => {
    const updated = await apiPatch<User>("/api/auth/me", prefs);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
