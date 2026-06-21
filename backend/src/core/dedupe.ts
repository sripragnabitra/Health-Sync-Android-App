/**
 * The real idempotency guarantee in this system lives in Postgres: a unique
 * index on (user_id, source_record_id) plus a batch `createMany({
 * skipDuplicates: true })`, so re-syncing the same Health Connect records
 * twice never produces duplicate rows even under concurrent requests.
 *
 * This module is the in-memory mirror of that same rule. It exists so the
 * partition logic — "which of these incoming records have we already seen"
 * — can be unit tested without a database connection, and so the sync
 * service can report accurate inserted/skipped counts back to the mobile
 * app without an extra round trip to ask Postgres "what did you skip".
 */

export interface SourceIdentified {
  sourceRecordId: string;
}

export interface PartitionResult<T> {
  fresh: T[];
  duplicateOfExisting: T[];
  duplicateWithinBatch: T[];
}

/**
 * Splits an incoming batch into three buckets:
 *  - fresh: not seen before, safe to insert
 *  - duplicateOfExisting: source_record_id already exists in the DB for this user
 *  - duplicateWithinBatch: the *same* source_record_id appears twice in one
 *    upload (a buggy retry on the client could do this) — only the first
 *    occurrence is kept as fresh.
 */
export function partitionBySourceId<T extends SourceIdentified>(
  incoming: T[],
  existingSourceIds: ReadonlySet<string>
): PartitionResult<T> {
  const fresh: T[] = [];
  const duplicateOfExisting: T[] = [];
  const duplicateWithinBatch: T[] = [];
  const seenInBatch = new Set<string>();

  for (const record of incoming) {
    if (existingSourceIds.has(record.sourceRecordId)) {
      duplicateOfExisting.push(record);
      continue;
    }
    if (seenInBatch.has(record.sourceRecordId)) {
      duplicateWithinBatch.push(record);
      continue;
    }
    seenInBatch.add(record.sourceRecordId);
    fresh.push(record);
  }

  return { fresh, duplicateOfExisting, duplicateWithinBatch };
}
