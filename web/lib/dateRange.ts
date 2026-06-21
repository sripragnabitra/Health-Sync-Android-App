/**
 * The three top-level period options the user can pick from the dashboard.
 * Everything on the page — summary cards AND all trend charts — reacts to
 * this single selection. No separate granularity/preset pickers needed.
 */

export type DateRangePeriod = "today" | "yesterday" | "last_week" | "last_month";

export interface DateRangeConfig {
  period: DateRangePeriod;
  label: string;
  /** Human description shown under the cards */
  description: string;
  /** Granularity the trend chart uses for this period */
  granularity: "daily" | "weekly";
  from: string;
  to: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildDateRangeConfig(period: DateRangePeriod): DateRangeConfig {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (period) {
    case "today": {
      const t = toISODate(today);
      return { period, label: "Today", description: "Showing today's data so far",
        granularity: "daily", from: t, to: t };
    }
    
    case "yesterday": {
      const from = toISODate(yesterday);
      const to = toISODate(yesterday);
      return {
        period,
        label: "Yesterday",
        description: `Showing data for ${yesterday.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
        granularity: "daily",
        from,
        to,
      };
    }

    case "last_week": {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      return {
        period,
        label: "Last Week",
        description: `Showing daily breakdown for the last 7 days`,
        granularity: "daily",
        from: toISODate(from),
        to: toISODate(today),
      };
    }

    case "last_month": {
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      return {
        period,
        label: "Last Month",
        description: `Showing daily breakdown for the last 30 days`,
        granularity: "daily",
        from: toISODate(from),
        to: toISODate(today),
      };
    }
  }
}

export const ALL_PERIODS: DateRangePeriod[] = ["yesterday", "last_week", "last_month"];
