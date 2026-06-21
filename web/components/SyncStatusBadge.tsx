"use client";

import { CheckCircle2, RefreshCw, XCircle, Clock } from "lucide-react";
import { SyncJobStatus } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";

interface SyncStatusBadgeProps {
  status: SyncJobStatus | null;
  lastSuccessfulSyncAt: string | null;
}

const STATUS_CONFIG: Record<SyncJobStatus, { label: string; fg: string; bg: string; bd: string }> = {
  SUCCESS: { label: "Synced", fg: "#2F6D52", bg: "#DCEADE", bd: "#BAD3C2" },
  RUNNING: { label: "Syncing…", fg: "#7A5012", bg: "#FBEFD1", bd: "#EAD9A4" },
  PENDING: { label: "Pending", fg: "#67617F", bg: "#F4EDE1", bd: "#DCD3BE" },
  FAILED: { label: "Sync failed", fg: "#8B3E50", bg: "#F5D5D5", bd: "#E8B6B6" },
};

export function SyncStatusBadge({ status, lastSuccessfulSyncAt }: SyncStatusBadgeProps) {
  const cfg = status ? STATUS_CONFIG[status] : STATUS_CONFIG.PENDING;
  const Icon = status === "SUCCESS" ? CheckCircle2 : status === "FAILED" ? XCircle : status === "RUNNING" ? RefreshCw : Clock;

  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold"
        style={{ color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.bd}` }}
      >
        <Icon size={13} className={status === "RUNNING" ? "animate-spin" : ""} />
        {cfg.label}
      </span>
      <span className="text-[13px] text-ink-muted">
        Last sync: <span className="font-medium text-ink-2">{formatRelativeTime(lastSuccessfulSyncAt)}</span>
      </span>
    </div>
  );
}
