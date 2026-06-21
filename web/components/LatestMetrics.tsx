"use client";

import { LatestMetric, PARAMETER_LABELS } from "@/lib/types";
import { formatValueForDisplay, formatRelativeTime } from "@/lib/format";

interface LatestMetricsProps {
  metrics: LatestMetric[];
}

export function LatestMetrics({ metrics }: LatestMetricsProps) {
  const withData = metrics.filter((m) => m.value !== null);

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h3 className="mb-4 font-serif text-[19px] text-ink-2">Latest readings</h3>
      {withData.length === 0 ? (
        <p className="text-[13.5px] text-ink-muted">No individual readings recorded yet.</p>
      ) : (
        <ul className="divide-y divide-border-soft">
          {withData.map((m) => (
            <li key={m.parameterType} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <span className="text-[14px] text-ink">{PARAMETER_LABELS[m.parameterType]}</span>
              <div className="text-right">
                <span className="font-mono text-[14.5px] font-medium tabular-nums text-ink-2">
                  {formatValueForDisplay(m.parameterType, m.value!)}
                </span>
                <span className="ml-2 text-[12px] text-ink-muted">{formatRelativeTime(m.recordedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
