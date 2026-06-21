/**
 * These mirror backend/src/core/types.ts and the JSON shapes the API
 * actually returns. In a monorepo this would be a `@health-sync/contract`
 * package imported by both sides; duplicated here to keep this a
 * standalone Next.js app that doesn't need the backend's source tree
 * present to build.
 */

export type ParameterType = "STEPS" | "DISTANCE_METERS" | "ACTIVE_CALORIES" | "HEART_RATE" | "SLEEP_DURATION";

export const PARAMETER_TYPES: ParameterType[] = [
  "STEPS",
  "DISTANCE_METERS",
  "ACTIVE_CALORIES",
  "HEART_RATE",
  "SLEEP_DURATION",
];

export const PARAMETER_LABELS: Record<ParameterType, string> = {
  STEPS: "Steps",
  DISTANCE_METERS: "Distance",
  ACTIVE_CALORIES: "Calories Burned",
  HEART_RATE: "Heart Rate",
  SLEEP_DURATION: "Sleep",
};

export interface DailyParameterSummary {
  parameterType: ParameterType;
  unit: string | null;
  totalValue: number | null;
  avgValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  recordCount: number;
}

export interface DailySummaryResponse {
  date: string;
  parameters: DailyParameterSummary[];
}

export interface LatestMetric {
  parameterType: ParameterType;
  value: number | null;
  unit: string | null;
  recordedAt: string | null;
}

export interface TrendPoint {
  bucketStart: string;
  bucketEnd: string;
  totalValue: number | null;
  avgValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  recordCount: number;
  hasData: boolean;
}

export interface TrendResponse {
  parameterType: ParameterType;
  granularity: "daily" | "weekly" | "monthly";
  points: TrendPoint[];
}

export type SyncJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface SyncError {
  id: string;
  errorCode: string;
  message: string;
  occurredAt: string;
}

export interface SyncJob {
  id: string;
  status: SyncJobStatus;
  trigger: "MANUAL" | "SCHEDULED";
  recordsReceived: number;
  recordsInserted: number;
  recordsSkipped: number;
  startedAt: string;
  completedAt: string | null;
  errors?: SyncError[];
  device?: { deviceModel: string | null; platform: string } | null;
}

export interface SyncStatusResponse {
  latestJob: SyncJob | null;
  lastSuccessfulSyncAt: string | null;
  recentJobs: SyncJob[];
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiErrorBody {
  error: { code: string; message: string; requestId: string; details?: unknown };
}
