import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateDaily, headlineValue } from "./aggregation";

test("aggregateDaily sums a summable parameter (steps) correctly", () => {
  const result = aggregateDaily("STEPS", [
    { value: 1200, recordedAt: "2026-06-15T07:00:00Z" },
    { value: 3000, recordedAt: "2026-06-15T12:00:00Z" },
    { value: 4221, recordedAt: "2026-06-15T18:00:00Z" },
  ]);
  assert.equal(result.totalValue, 8421);
  assert.equal(result.recordCount, 3);
  assert.equal(result.minValue, 1200);
  assert.equal(result.maxValue, 4221);
});

test("aggregateDaily does NOT sum heart rate — total is null, avg is meaningful", () => {
  const result = aggregateDaily("HEART_RATE", [
    { value: 62, recordedAt: "2026-06-15T02:00:00Z" },
    { value: 78, recordedAt: "2026-06-15T14:00:00Z" },
    { value: 94, recordedAt: "2026-06-15T17:30:00Z" },
  ]);
  assert.equal(result.totalValue, null, "summing bpm readings is physically meaningless");
  assert.equal(result.avgValue, 78);
  assert.equal(result.minValue, 62);
  assert.equal(result.maxValue, 94);
});

test("aggregateDaily handles an empty day without dividing by zero", () => {
  const result = aggregateDaily("STEPS", []);
  assert.deepEqual(result, {
    totalValue: null,
    avgValue: null,
    minValue: null,
    maxValue: null,
    recordCount: 0,
  });
});

test("aggregateDaily rounds to 4 decimal places", () => {
  const result = aggregateDaily("DISTANCE_METERS", [
    { value: 100.123456, recordedAt: "2026-06-15T07:00:00Z" },
    { value: 50.000001, recordedAt: "2026-06-15T08:00:00Z" },
  ]);
  assert.equal(result.totalValue, 150.1235);
});

test("headlineValue picks total for steps, average for heart rate", () => {
  const stepsAgg = aggregateDaily("STEPS", [{ value: 500, recordedAt: "2026-06-15T07:00:00Z" }]);
  const hrAgg = aggregateDaily("HEART_RATE", [{ value: 70, recordedAt: "2026-06-15T07:00:00Z" }]);
  assert.equal(headlineValue("STEPS", stepsAgg), 500);
  assert.equal(headlineValue("HEART_RATE", hrAgg), 70);
});
