import { test } from "node:test";
import assert from "node:assert/strict";
import { partitionBySourceId } from "./dedupe";

test("partitionBySourceId treats unseen records as fresh", () => {
  const result = partitionBySourceId(
    [{ sourceRecordId: "hc-001" }, { sourceRecordId: "hc-002" }],
    new Set<string>()
  );
  assert.equal(result.fresh.length, 2);
  assert.equal(result.duplicateOfExisting.length, 0);
  assert.equal(result.duplicateWithinBatch.length, 0);
});

test("partitionBySourceId catches records that already exist in the DB — the re-sync case", () => {
  // Simulates: user taps "manual re-sync", Health Connect hands back the
  // same 30-day window, most of which was already uploaded yesterday.
  const result = partitionBySourceId(
    [{ sourceRecordId: "hc-001" }, { sourceRecordId: "hc-002" }, { sourceRecordId: "hc-003" }],
    new Set(["hc-001", "hc-002"])
  );
  assert.deepEqual(result.fresh.map((r) => r.sourceRecordId), ["hc-003"]);
  assert.equal(result.duplicateOfExisting.length, 2);
});

test("partitionBySourceId catches a duplicate source id within the same upload batch", () => {
  // Simulates a buggy/retried client request that includes the same record twice.
  const result = partitionBySourceId(
    [{ sourceRecordId: "hc-001" }, { sourceRecordId: "hc-001" }, { sourceRecordId: "hc-002" }],
    new Set<string>()
  );
  assert.equal(result.fresh.length, 2);
  assert.equal(result.duplicateWithinBatch.length, 1);
});

test("partitionBySourceId never double-counts a record across both duplicate buckets", () => {
  const incoming = [{ sourceRecordId: "hc-001" }, { sourceRecordId: "hc-001" }];
  const result = partitionBySourceId(incoming, new Set(["hc-001"]));
  // hc-001 already exists AND repeats in-batch — it must land in exactly one bucket.
  const total =
    result.fresh.length + result.duplicateOfExisting.length + result.duplicateWithinBatch.length;
  assert.equal(total, incoming.length);
  assert.equal(result.duplicateOfExisting.length, 2);
  assert.equal(result.duplicateWithinBatch.length, 0);
});
