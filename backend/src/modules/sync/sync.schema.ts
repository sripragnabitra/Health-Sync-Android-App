import { z } from "zod";

/**
 * Wire format for one normalized health reading from the mobile app.
 *
 * Notably absent: `unit`. The server is the single source of truth for
 * units (see core/types.ts PARAMETER_UNITS) — accepting a client-supplied
 * unit would let a buggy client silently store "steps" in kilometers.
 *
 * `localDate` (not derived server-side from `recordedAt`) is the calendar
 * day this reading counts toward, e.g. "2026-06-15". The phone is the only
 * party in this system that reliably knows the user's local timezone at
 * the moment of the reading, so it computes this once and sends it,
 * instead of the backend guessing from a UTC instant.
 */
const recordSchema = z.object({
  sourceRecordId: z.string().min(1).max(200),
  parameterType: z.enum(["STEPS", "DISTANCE_METERS", "ACTIVE_CALORIES", "HEART_RATE", "SLEEP_DURATION"]),
  value: z.number().finite().nonnegative(),
  recordedAt: z.coerce.date(),
  recordedEndAt: z.coerce.date().optional(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "localDate must be YYYY-MM-DD"),
});

export const ingestSchema = z.object({
  deviceId: z.string().uuid(),
  trigger: z.enum(["MANUAL", "SCHEDULED"]).default("MANUAL"),
  records: z.array(recordSchema).min(1).max(5000, "Split uploads over 5000 records into multiple batches"),
});

export type IngestInput = z.infer<typeof ingestSchema>;
export type RecordInput = z.infer<typeof recordSchema>;
