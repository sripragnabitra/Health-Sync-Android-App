"use client";

import { ALL_PERIODS, DateRangePeriod, buildDateRangeConfig } from "@/lib/dateRange";

interface PeriodSelectorProps {
  selected: DateRangePeriod;
  onChange: (p: DateRangePeriod) => void;
}

/**
 * The single top-level control that drives everything on the dashboard —
 * the summary cards, the trend charts, the parameter picker — all react
 * to this one selection. Deliberately placed at the very top of the page
 * so it's the first thing the user sees and interacts with.
 */
export function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Showing</span>
      <div className="flex rounded-full border border-border bg-surface-muted p-0.5">
        {ALL_PERIODS.map((period) => {
          const cfg = buildDateRangeConfig(period);
          return (
            <button
              key={period}
              onClick={() => onChange(period)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                selected === period
                  ? "bg-ink text-ink-onDark shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
