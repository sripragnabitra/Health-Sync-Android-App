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
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch() throws (not a rejected HTTP response) when the network
    // itself fails — server down, no internet, DNS failure, etc.
    throw new ApiError("Can't reach the server right now. Please try again in a moment.", "NETWORK_ERROR", 0);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    let message = body?.error?.message ?? `Request failed with status ${res.status}`;
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    // For validation errors, the backend's "Request validation failed" is
    // generic on purpose (covers many possible bad fields) — but it also
    // sends which specific field(s) failed in `details.fieldErrors`. Surface
    // the first real one so the user sees "email: Invalid email" instead of
    // just "Request validation failed".
    if (code === "VALIDATION_ERROR" && body?.error?.details?.fieldErrors) {
      const fieldErrors = body.error.details.fieldErrors as Record<string, string[]>;
      const firstField = Object.keys(fieldErrors)[0];
      if (firstField && fieldErrors[firstField]?.[0]) {
        message = `${firstField}: ${fieldErrors[firstField][0]}`;
      }
    }
    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
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
