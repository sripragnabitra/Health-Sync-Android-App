import { prisma } from "../../db/prisma";
import { aggregateDaily } from "../../core/aggregation";
import { PARAMETER_UNITS, ParameterType } from "../../core/types";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { RecordInput } from "./sync.schema";

export interface IngestSummary {
  syncJobId: string;
  status: string;
  recordsReceived: number;
  recordsInserted: number;
  recordsSkippedAsDuplicate: number;
  daysRecalculated: number;
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * The full ingestion pipeline for one upload batch:
 *
 *   1. Open a sync_jobs row (status RUNNING) so the dashboard's sync
 *      indicator has something to show even mid-upload.
 *   2. Batch-insert into health_records with `skipDuplicates: true`. The
 *      DB-level unique index on (user_id, source_record_id) is what
 *      actually guarantees idempotency — re-uploading the same Health
 *      Connect records (e.g. the user taps "re-sync" and the app re-reads
 *      the last 7 days) is a safe no-op, not a duplicate.
 *   3. Recompute daily_health_summaries only for the (date, parameter)
 *      pairs this batch touched — not the user's whole history — by
 *      re-reading that day's full record set and running it back through
 *      the same `aggregateDaily` used in core/aggregation.test.ts.
 *   4. Close out the sync_jobs row with real counts. Any failure along the
 *      way is captured in sync_errors and the job is marked FAILED rather
 *      than left RUNNING forever.
 */
export async function ingestHealthRecords(
  userId: string,
  deviceId: string,
  trigger: "MANUAL" | "SCHEDULED",
  records: RecordInput[]
): Promise<IngestSummary> {
  const device = await prisma.device.findFirst({ where: { id: deviceId, userId } });
  if (!device) {
    throw new AppError("NOT_FOUND", "Unknown device for this account — register the device before syncing");
  }

  const syncJob = await prisma.syncJob.create({
    data: { userId, deviceId, status: "RUNNING", trigger, recordsReceived: records.length },
  });

  try {
    const insertResult = await prisma.healthRecord.createMany({
      data: records.map((r) => ({
        userId,
        deviceId,
        syncJobId: syncJob.id,
        sourceRecordId: r.sourceRecordId,
        parameterType: r.parameterType,
        value: r.value,
        unit: PARAMETER_UNITS[r.parameterType as ParameterType],
        recordedAt: r.recordedAt,
        recordedEndAt: r.recordedEndAt,
        localDate: new Date(`${r.localDate}T00:00:00.000Z`),
      })),
      skipDuplicates: true,
    });

    const inserted = insertResult.count;
    const skipped = records.length - inserted;

    const affectedBuckets = new Map<string, { localDate: string; parameterType: ParameterType }>();
    for (const r of records) {
      affectedBuckets.set(`${r.localDate}__${r.parameterType}`, {
        localDate: r.localDate,
        parameterType: r.parameterType as ParameterType,
      });
    }

    for (const bucket of affectedBuckets.values()) {
      await recomputeDailySummary(userId, bucket.localDate, bucket.parameterType);
    }

    const completed = await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "SUCCESS",
        recordsInserted: inserted,
        recordsSkipped: skipped,
        completedAt: new Date(),
      },
    });

    logger.info("Sync completed", { userId, syncJobId: syncJob.id, inserted, skipped });

    return {
      syncJobId: completed.id,
      status: completed.status,
      recordsReceived: records.length,
      recordsInserted: inserted,
      recordsSkippedAsDuplicate: skipped,
      daysRecalculated: affectedBuckets.size,
      startedAt: completed.startedAt,
      completedAt: completed.completedAt,
    };
  } catch (err) {
    await recordSyncFailure(syncJob.id, err);
    throw err;
  }
}

async function recomputeDailySummary(userId: string, localDate: string, parameterType: ParameterType) {
  const dayRecords = await prisma.healthRecord.findMany({
    where: { userId, parameterType, localDate: new Date(`${localDate}T00:00:00.000Z`) },
    select: { value: true, recordedAt: true },
  });

  const points = dayRecords.map((r) => ({
    value: r.value.toNumber(),
    recordedAt: r.recordedAt.toISOString(),
  }));
  const agg = aggregateDaily(parameterType, points);

  await prisma.dailyHealthSummary.upsert({
    where: {
      userId_summaryDate_parameterType: {
        userId,
        summaryDate: new Date(`${localDate}T00:00:00.000Z`),
        parameterType,
      },
    },
    create: {
      userId,
      summaryDate: new Date(`${localDate}T00:00:00.000Z`),
      parameterType,
      unit: PARAMETER_UNITS[parameterType],
      totalValue: agg.totalValue,
      avgValue: agg.avgValue,
      minValue: agg.minValue,
      maxValue: agg.maxValue,
      recordCount: agg.recordCount,
    },
    update: {
      totalValue: agg.totalValue,
      avgValue: agg.avgValue,
      minValue: agg.minValue,
      maxValue: agg.maxValue,
      recordCount: agg.recordCount,
    },
  });
}

async function recordSyncFailure(syncJobId: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  logger.error("Sync failed", { syncJobId, message });

  await prisma.syncError.create({
    data: {
      syncJobId,
      errorCode: "INGESTION_FAILED",
      message,
      context: err instanceof Error ? { stack: err.stack } : undefined,
    },
  });
  await prisma.syncJob.update({
    where: { id: syncJobId },
    data: { status: "FAILED", completedAt: new Date() },
  });
}

export async function getSyncStatus(userId: string) {
  const [latestJob, recentJobs, lastSuccessful] = await Promise.all([
    prisma.syncJob.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: { errors: true, device: { select: { deviceModel: true, platform: true } } },
    }),
    prisma.syncJob.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.syncJob.findFirst({
      where: { userId, status: "SUCCESS" },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  return {
    latestJob,
    lastSuccessfulSyncAt: lastSuccessful?.completedAt ?? null,
    recentJobs,
  };
}
