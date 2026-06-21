"use client";

import { ReactNode } from "react";
import { Sparkline } from "./Sparkline";

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: string | null;
  caption?: string;
  accentColor: string;
  sparklineData?: number[];
  isEmpty?: boolean;
}

/**
 * Deliberately styled like a vital-sign monitor readout rather than a
 * generic SaaS metric tile: large tabular-numeral mono digits for the
 * value (precision, at-a-glance scanability — the same reason hospital
 * monitors and stopwatches use monospace), a small-caps label above in
 * the body sans, and a quiet sparkline trace beneath rather than a chart.
 * This is the one place this dashboard spends its visual boldness — every
 * other element stays deliberately quiet.
 */
export function SummaryCard({ icon, label, value, caption, accentColor, sparklineData, isEmpty }: SummaryCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(87,82,121,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-gradient-to-b from-white to-surface-muted text-amber-display"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(87,82,121,0.1)" }}
        >
          {icon}
        </span>
      </div>

      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">{label}</div>

      {isEmpty || value === null ? (
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[28px] font-normal text-ink-muted">No data yet</span>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="font-mono text-[30px] font-medium tabular-nums leading-none text-ink-2">{value}</span>
            {caption && <div className="mt-1 text-[12.5px] text-ink-muted">{caption}</div>}
          </div>
          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline points={sparklineData} color={accentColor} />
          )}
        </div>
      )}
    </div>
  );
}
