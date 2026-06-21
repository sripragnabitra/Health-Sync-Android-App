import {
  AuthResponse,
  DailySummaryResponse,
  LatestMetric,
  ParameterType,
  SyncStatusResponse,
  TrendResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("healthsync_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error?.message ?? `Request failed with status ${res.status}`;
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    throw new ApiError(message, code, res.status);
  }

  return body?.data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  signup: (email: string, password: string, fullName?: string) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, fullName }) }),

  getDailySummary: (date?: string) => request<DailySummaryResponse>(`/summary/daily${date ? `?date=${date}` : ""}`),

  getLatestMetrics: () => request<LatestMetric[]>("/summary/latest"),

  getTrend: (parameterType: ParameterType, granularity: "daily" | "weekly" | "monthly", from: string, to: string) =>
    request<TrendResponse>(`/summary/trend/${granularity}?parameterType=${parameterType}&from=${from}&to=${to}`),

  getSyncStatus: () => request<SyncStatusResponse>("/sync/status"),
};

export function saveToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem("healthsync_token", token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem("healthsync_token");
}

export function hasToken(): boolean {
  return getToken() !== null;
}
