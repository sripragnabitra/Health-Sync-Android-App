/**
 * All dates in this module are plain "YYYY-MM-DD" strings, not Date objects
 * with timezones attached. `daily_health_summaries.summary_date` is a
 * Postgres DATE (no time component) keyed to the date the phone recorded
 * against, so bucketing logic here stays timezone-free by construction —
 * the timezone decision was already made on the mobile client when it
 * grouped Health Connect readings into a calendar day.
 */

export interface DateBucket {
  /** e.g. "2026-06-08" for daily/weekly start, "2026-06-01" for monthly start */
  bucketStart: string;
  bucketEnd: string;
}

function parseISODate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function formatISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/** Builds the list of individual day buckets between two dates, inclusive. */
export function dailyBuckets(from: string, to: string): DateBucket[] {
  const start = parseISODate(from);
  const end = parseISODate(to);
  const buckets: DateBucket[] = [];
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    const s = formatISODate(d);
    buckets.push({ bucketStart: s, bucketEnd: s });
  }
  return buckets;
}

/**
 * Buckets a date range into ISO-style weeks (Monday start) that overlap the
 * range, clamped to [from, to] at the edges so partial weeks at either end
 * don't pull in days outside what was asked for.
 */
export function weeklyBuckets(from: string, to: string): DateBucket[] {
  const start = parseISODate(from);
  const end = parseISODate(to);
  const buckets: DateBucket[] = [];

  // Roll back to the Monday on/before `start`.
  const dow = start.getUTCDay(); // 0=Sun..6=Sat
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  let weekStart = addDays(start, -daysFromMonday);

  while (weekStart.getTime() <= end.getTime()) {
    const weekEnd = addDays(weekStart, 6);
    const clampedStart = weekStart.getTime() < start.getTime() ? start : weekStart;
    const clampedEnd = weekEnd.getTime() > end.getTime() ? end : weekEnd;
    buckets.push({ bucketStart: formatISODate(clampedStart), bucketEnd: formatISODate(clampedEnd) });
    weekStart = addDays(weekStart, 7);
  }
  return buckets;
}

/** Buckets a date range into calendar months that overlap the range, clamped at the edges. */
export function monthlyBuckets(from: string, to: string): DateBucket[] {
  const start = parseISODate(from);
  const end = parseISODate(to);
  const buckets: DateBucket[] = [];

  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor.getTime() <= end.getTime()) {
    const monthStart = cursor;
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    const clampedStart = monthStart.getTime() < start.getTime() ? start : monthStart;
    const clampedEnd = monthEnd.getTime() > end.getTime() ? end : monthEnd;
    buckets.push({ bucketStart: formatISODate(clampedStart), bucketEnd: formatISODate(clampedEnd) });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return buckets;
}

export function isValidISODate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;

  const parsed = parseISODate(d);
  if (Number.isNaN(parsed.getTime())) return false;

  // `Date.UTC` silently normalizes overflow instead of rejecting it — month
  // 13 quietly becomes January of next year, day 40 rolls into next month.
  // Round-tripping and comparing back against the original string is the
  // only way to actually catch that instead of accepting a corrupted date.
  return formatISODate(parsed) === d;
}
