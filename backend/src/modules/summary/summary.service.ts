import { prisma } from "../../db/prisma";
import { PARAMETER_TYPES, ParameterType } from "../../core/types";
import { dailyBuckets, weeklyBuckets, monthlyBuckets } from "../../core/dateRange";
import { rollupIntoBuckets, DailySummaryRow } from "../../core/rollup";
import { AppError } from "../../utils/AppError";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * One row per tracked parameter for a single calendar day — this is what
 * powers the "Today's Steps / Sleep / Heart Rate / Calories / Distance"
 * cards on the dashboard. Parameters with no data that day are still
 * included, with nulls, so the UI can render its empty state per-card
 * instead of the card silently disappearing.
 */
export async function getDailySummary(userId: string, date?: string) {
  const targetDate = date ?? todayISO();

  const rows = await prisma.dailyHealthSummary.findMany({
    where: { userId, summaryDate: new Date(`${targetDate}T00:00:00.000Z`) },
  });

  const byParameter = new Map(rows.map((r) => [r.parameterType, r]));

  return {
    date: targetDate,
    parameters: PARAMETER_TYPES.map((parameterType) => {
      const row = byParameter.get(parameterType);
      return {
        parameterType,
        unit: row?.unit ?? null,
        totalValue: row ? row.totalValue?.toNumber() ?? null : null,
        avgValue: row ? row.avgValue?.toNumber() ?? null : null,
        minValue: row ? row.minValue?.toNumber() ?? null : null,
        maxValue: row ? row.maxValue?.toNumber() ?? null : null,
        recordCount: row?.recordCount ?? 0,
      };
    }),
  };
}

/**
 * The single most recent raw reading per parameter, regardless of which
 * day it fell on — distinct from the daily summary. "Latest health
 * metrics" on the dashboard wants the actual last heart rate reading, not
 * today's average of however many readings came in.
 */
export async function getLatestMetrics(userId: string) {
  const results = await Promise.all(
    PARAMETER_TYPES.map(async (parameterType) => {
      const latest = await prisma.healthRecord.findFirst({
        where: { userId, parameterType },
        orderBy: { recordedAt: "desc" },
      });
      return {
        parameterType,
        value: latest?.value.toNumber() ?? null,
        unit: latest?.unit ?? null,
        recordedAt: latest?.recordedAt ?? null,
      };
    })
  );
  return results;
}

export type Granularity = "daily" | "weekly" | "monthly";

/**
 * Weekly/monthly trend data for the charts. Deliberately built on top of
 * daily_health_summaries (already-aggregated rows) rather than re-scanning
 * raw health_records — same table the "today" cards read from, so a given
 * day's number is computed exactly once no matter which screen asks for it.
 */
export async function getTrend(
  userId: string,
  parameterType: ParameterType,
  granularity: Granularity,
  from: string,
  to: string
) {
  const rows = await prisma.dailyHealthSummary.findMany({
    where: {
      userId,
      parameterType,
      summaryDate: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
    },
    orderBy: { summaryDate: "asc" },
  });

  const dailyRows: DailySummaryRow[] = rows.map((r) => ({
    date: r.summaryDate.toISOString().slice(0, 10),
    totalValue: r.totalValue?.toNumber() ?? null,
    avgValue: r.avgValue?.toNumber() ?? null,
    minValue: r.minValue?.toNumber() ?? null,
    maxValue: r.maxValue?.toNumber() ?? null,
    recordCount: r.recordCount,
  }));

  const buckets =
    granularity === "daily" ? dailyBuckets(from, to) : granularity === "weekly" ? weeklyBuckets(from, to) : monthlyBuckets(from, to);

  if (buckets.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Date range produced no buckets");
  }

  return {
    parameterType,
    granularity,
    points: rollupIntoBuckets(parameterType, dailyRows, buckets),
  };
}
