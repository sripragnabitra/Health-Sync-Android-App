/**
 * Domain-level types for the five tracked health parameters.
 *
 * Kept separate from the Prisma-generated types on purpose: this file has
 * zero dependencies, so the aggregation and dedupe logic in this folder can
 * be unit tested with plain `node:test`, with no database and no Express
 * server required to boot.
 */

export type ParameterType =
  | "STEPS"
  | "DISTANCE_METERS"
  | "ACTIVE_CALORIES"
  | "HEART_RATE"
  | "SLEEP_DURATION";

export const PARAMETER_TYPES: ParameterType[] = [
  "STEPS",
  "DISTANCE_METERS",
  "ACTIVE_CALORIES",
  "HEART_RATE",
  "SLEEP_DURATION",
];

/** Canonical unit for each parameter, enforced at the validation layer. */
export const PARAMETER_UNITS: Record<ParameterType, string> = {
  STEPS: "count",
  DISTANCE_METERS: "m",
  ACTIVE_CALORIES: "kcal",
  HEART_RATE: "bpm",
  SLEEP_DURATION: "min",
};

/**
 * Parameters where a daily *total* is physically meaningful (you can sum
 * steps taken across the day). Heart rate is the odd one out — summing bpm
 * readings means nothing, so it only gets avg/min/max.
 */
export const SUMMABLE_PARAMETERS: ParameterType[] = [
  "STEPS",
  "DISTANCE_METERS",
  "ACTIVE_CALORIES",
  "SLEEP_DURATION",
];

export interface RawHealthPoint {
  value: number;
  recordedAt: string; // ISO 8601
}

export interface DailyAggregateResult {
  totalValue: number | null;
  avgValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  recordCount: number;
}
