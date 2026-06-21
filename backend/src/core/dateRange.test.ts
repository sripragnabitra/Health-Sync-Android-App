import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyBuckets, weeklyBuckets, monthlyBuckets, isValidISODate } from "./dateRange";

test("dailyBuckets produces one bucket per calendar day, inclusive", () => {
  const buckets = dailyBuckets("2026-06-01", "2026-06-03");
  assert.deepEqual(buckets, [
    { bucketStart: "2026-06-01", bucketEnd: "2026-06-01" },
    { bucketStart: "2026-06-02", bucketEnd: "2026-06-02" },
    { bucketStart: "2026-06-03", bucketEnd: "2026-06-03" },
  ]);
});

test("weeklyBuckets clamps the first and last week to the requested range", () => {
  // 2026-06-03 is a Wednesday. The ISO week is Mon 2026-06-01 .. Sun 2026-06-07.
  const buckets = weeklyBuckets("2026-06-03", "2026-06-10");
  assert.equal(buckets[0].bucketStart, "2026-06-03", "clamped, not the Monday before the range");
  assert.equal(buckets[0].bucketEnd, "2026-06-07");
  assert.equal(buckets[1].bucketStart, "2026-06-08");
  assert.equal(buckets[1].bucketEnd, "2026-06-10", "clamped, not the Sunday after the range");
});

test("monthlyBuckets clamps partial months at both edges", () => {
  const buckets = monthlyBuckets("2026-05-20", "2026-07-05");
  assert.equal(buckets.length, 3);
  assert.deepEqual(buckets[0], { bucketStart: "2026-05-20", bucketEnd: "2026-05-31" });
  assert.deepEqual(buckets[1], { bucketStart: "2026-06-01", bucketEnd: "2026-06-30" });
  assert.deepEqual(buckets[2], { bucketStart: "2026-07-01", bucketEnd: "2026-07-05" });
});

test("isValidISODate rejects garbage and malformed dates", () => {
  assert.equal(isValidISODate("2026-06-15"), true);
  assert.equal(isValidISODate("2026-13-40"), false);
  assert.equal(isValidISODate("not-a-date"), false);
  assert.equal(isValidISODate(""), false);
});
