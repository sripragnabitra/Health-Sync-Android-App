import {
  DailyAggregateResult,
  ParameterType,
  RawHealthPoint,
  SUMMABLE_PARAMETERS,
} from "./types";

/**
 * Rounds to 4 decimal places. Health values come from a phone sensor, not a
 * lab instrument — anything past 4dp is noise, and it keeps Postgres
 * NUMERIC(12,4) columns from accumulating floating point artifacts.
 */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Reduces a set of same-day, same-parameter records into the row shape
 * stored in `daily_health_summaries`.
 *
 * This function is the one piece of business logic in the whole backend
 * that genuinely deserves a unit test: get it wrong and every chart on the
 * dashboard is quietly wrong too. It has no knowledge of Express, Prisma, or
 * dates as calendar concepts — callers are responsible for grouping records
 * into "the right day" before calling this.
 */
export function aggregateDaily(
  parameterType: ParameterType,
  records: RawHealthPoint[]
): DailyAggregateResult {
  if (records.length === 0) {
    return { totalValue: null, avgValue: null, minValue: null, maxValue: null, recordCount: 0 };
  }

  const values = records.map((r) => r.value);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const isSummable = SUMMABLE_PARAMETERS.includes(parameterType);

  return {
    totalValue: isSummable ? round4(sum) : null,
    avgValue: round4(avg),
    minValue: round4(min),
    maxValue: round4(max),
    recordCount: values.length,
  };
}

/**
 * Picks which value a dashboard "today" card should headline for a given
 * parameter: the total for cumulative metrics (steps), the average for
 * point-in-time metrics (heart rate).
 */
export function headlineValue(parameterType: ParameterType, agg: DailyAggregateResult): number | null {
  return SUMMABLE_PARAMETERS.includes(parameterType) ? agg.totalValue : agg.avgValue;
}
