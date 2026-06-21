import { ParameterType, SUMMABLE_PARAMETERS } from "./types";
import { round4 } from "./aggregation";
import { DateBucket } from "./dateRange";

export interface DailySummaryRow {
  date: string; // YYYY-MM-DD
  totalValue: number | null;
  avgValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  recordCount: number;
}

export interface BucketRollup extends DateBucket {
  totalValue: number | null;
  avgValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  recordCount: number;
  /** false when no daily summary row exists anywhere in this bucket — drives the chart's empty-state rendering */
  hasData: boolean;
}

/**
 * Rolls already-computed daily summaries up into weekly/monthly trend
 * points. This is intentionally a *second* aggregation pass over
 * pre-aggregated daily rows (not a re-aggregation of raw records) — the
 * dashboard's weekly/monthly charts read from daily_health_summaries, the
 * same table the "today" cards read from, so a number never has two
 * different code paths computing it two different ways.
 *
 * For summable parameters (steps, distance, calories, sleep), totalValue
 * is the sum of each day's total — "how many steps this week". avgValue
 * is the average *daily* total — "average steps per day this week".
 *
 * For stat-only parameters (heart rate), there is no totalValue. avgValue
 * is a record-count-weighted average of each day's average, so a day with
 * 40 heart rate readings doesn't get the same weight as a day with 2.
 */
export function rollupIntoBuckets(
  parameterType: ParameterType,
  dailyRows: DailySummaryRow[],
  buckets: DateBucket[]
): BucketRollup[] {
  const isSummable = SUMMABLE_PARAMETERS.includes(parameterType);

  return buckets.map((bucket) => {
    const rowsInBucket = dailyRows.filter(
      (r) => r.date >= bucket.bucketStart && r.date <= bucket.bucketEnd
    );

    if (rowsInBucket.length === 0) {
      return { ...bucket, totalValue: null, avgValue: null, minValue: null, maxValue: null, recordCount: 0, hasData: false };
    }

    const recordCount = rowsInBucket.reduce((acc, r) => acc + r.recordCount, 0);

    const mins = rowsInBucket.map((r) => r.minValue).filter((v): v is number => v !== null);
    const maxs = rowsInBucket.map((r) => r.maxValue).filter((v): v is number => v !== null);
    const minValue = mins.length ? Math.min(...mins) : null;
    const maxValue = maxs.length ? Math.max(...maxs) : null;

    let totalValue: number | null = null;
    let avgValue: number | null = null;

    if (isSummable) {
      const total = rowsInBucket.reduce((acc, r) => acc + (r.totalValue ?? 0), 0);
      totalValue = round4(total);
      avgValue = rowsInBucket.length > 0 ? round4(total / rowsInBucket.length) : null;
    } else if (recordCount > 0) {
      const weightedSum = rowsInBucket.reduce((acc, r) => acc + (r.avgValue ?? 0) * r.recordCount, 0);
      avgValue = round4(weightedSum / recordCount);
    }

    return { ...bucket, totalValue, avgValue, minValue, maxValue, recordCount, hasData: true };
  });
}
