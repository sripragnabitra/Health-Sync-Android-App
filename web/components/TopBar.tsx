"use client";

import { Activity, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { SyncJobStatus } from "@/lib/types";

interface TopBarProps {
  status: SyncJobStatus | null;
  lastSuccessfulSyncAt: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function TopBar({ status, lastSuccessfulSyncAt, onRefresh, isRefreshing }: TopBarProps) {
  const { logout } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft bg-bg px-6 py-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink text-ink-onDark">
          <Activity size={17} />
        </span>
        <span className="font-serif text-[20px] text-ink-2">Health Sync</span>
      </div>

      <div className="flex items-center gap-4">
        <SyncStatusBadge status={status} lastSuccessfulSyncAt={lastSuccessfulSyncAt} />
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  );
}
