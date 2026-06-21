"use client";

import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-denial-bd bg-denial-bg px-8 py-16 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-denial-bd bg-surface text-denial-fg">
        <AlertTriangle size={22} />
      </span>
      <h2 className="font-serif text-xl text-denial-fg">Couldn&rsquo;t load your data</h2>
      <p className="mt-2 max-w-sm text-[14px] text-denial-fg/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 rounded-full border border-denial-bd bg-surface px-4 py-1.5 text-[13px] font-semibold text-denial-fg transition-colors hover:bg-denial-bg"
        >
          Try again
        </button>
      )}
    </div>
  );
}
