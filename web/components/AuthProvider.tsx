"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearToken, hasToken, saveToken } from "@/lib/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(): boolean {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem("healthsync_token");
  if (!token) return false;
  const expiry = getTokenExpiry(token);
  if (expiry === null) return false;
  return Date.now() >= expiry - 5000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    if (!hasToken() || isTokenExpired()) {
      if (hasToken()) {
        clearToken();
        setIsAuthenticated(false);
        router.push("/login");
      } else {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    setIsLoading(false);
  }, [checkAuth]);

  useEffect(() => {
    window.addEventListener("focus", checkAuth);
    return () => window.removeEventListener("focus", checkAuth);
  }, [checkAuth]);

  useEffect(() => {
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, [checkAuth]);

  function login(token: string) {
    saveToken(token);
    setIsAuthenticated(true);
  }

  function logout() {
    clearToken();
    setIsAuthenticated(false);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}