"use client";

import { Smartphone } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-strong bg-surface-muted px-8 py-16 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-ink-muted">
        <Smartphone size={22} />
      </span>
      <h2 className="font-serif text-xl text-ink-2">No health data yet</h2>
      <p className="mt-2 max-w-sm text-[14px] text-ink-muted">
        Open the Health Sync app on your phone, grant Health Connect permissions, and tap Sync. Your
        steps, sleep, heart rate, calories, and distance will show up here right after.
      </p>
    </div>
  );
}
