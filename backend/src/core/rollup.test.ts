import { test } from "node:test";
import assert from "node:assert/strict";
import { rollupIntoBuckets, DailySummaryRow } from "./rollup";
import { weeklyBuckets } from "./dateRange";

function steps(date: string, total: number, count: number): DailySummaryRow {
  return { date, totalValue: total, avgValue: total / count, minValue: 0, maxValue: total, recordCount: count };
}

function heartRate(date: string, avg: number, count: number): DailySummaryRow {
  return { date, totalValue: null, avgValue: avg, minValue: avg - 10, maxValue: avg + 10, recordCount: count };
}

test("rollupIntoBuckets sums daily totals for a summable parameter (steps) across a week", () => {
  const rows = [steps("2026-06-01", 8000, 1), steps("2026-06-02", 9500, 1), steps("2026-06-03", 7200, 1)];
  const buckets = weeklyBuckets("2026-06-01", "2026-06-03");
  const result = rollupIntoBuckets("STEPS", rows, buckets);

  assert.equal(result.length, 1);
  assert.equal(result[0].totalValue, 8000 + 9500 + 7200);
  assert.equal(result[0].avgValue, Math.round(((8000 + 9500 + 7200) / 3) * 10000) / 10000, "avg should be average daily total, rounded to 4dp");
  assert.equal(result[0].hasData, true);
});

test("rollupIntoBuckets weights heart rate average by record count, not by day count", () => {
  // Day 1: 2 readings averaging 60. Day 2: 18 readings averaging 100.
  // A naive (60+100)/2 = 80 would be wrong — day 2's far larger sample should dominate.
  const rows = [heartRate("2026-06-01", 60, 2), heartRate("2026-06-02", 100, 18)];
  const buckets = weeklyBuckets("2026-06-01", "2026-06-02");
  const result = rollupIntoBuckets("HEART_RATE", rows, buckets);

  const expectedWeightedAvg = (60 * 2 + 100 * 18) / 20;
  assert.equal(result[0].totalValue, null, "heart rate never gets a total");
  assert.equal(result[0].avgValue, expectedWeightedAvg);
});

test("rollupIntoBuckets marks a bucket with no underlying daily rows as hasData=false", () => {
  const buckets = weeklyBuckets("2026-06-01", "2026-06-07");
  const result = rollupIntoBuckets("STEPS", [], buckets);

  assert.equal(result.length, 1);
  assert.equal(result[0].hasData, false);
  assert.equal(result[0].totalValue, null);
});

test("rollupIntoBuckets only includes rows that actually fall inside each bucket's date range", () => {
  // Two weeks of data; bucket 2 should not pick up bucket 1's row.
  const rows = [steps("2026-06-01", 1000, 1), steps("2026-06-10", 5000, 1)];
  const buckets = weeklyBuckets("2026-06-01", "2026-06-14");
  const result = rollupIntoBuckets("STEPS", rows, buckets);

  assert.equal(result.length, 2);
  assert.equal(result[0].totalValue, 1000);
  assert.equal(result[1].totalValue, 5000);
});
