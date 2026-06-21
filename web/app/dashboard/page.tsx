"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footprints, Route, Flame, HeartPulse, Moon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { TopBar } from "@/components/TopBar";
import { SummaryCard } from "@/components/SummaryCard";
import { LatestMetrics } from "@/components/LatestMetrics";
import { TrendChart } from "@/components/TrendChart";
import { PeriodSelector } from "@/components/PeriodSelector";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { api, ApiError } from "@/lib/api";
import { buildDateRangeConfig, DateRangePeriod } from "@/lib/dateRange";
import { formatValueForDisplay } from "@/lib/format";
import {
  DailySummaryResponse,
  LatestMetric,
  ParameterType,
  SyncStatusResponse,
  TrendResponse,
} from "@/lib/types";

// ── Card config ────────────────────────────────────────────────────────────────

const CARDS: { type: ParameterType; icon: React.ReactNode; accent: string; label: string }[] = [
  { type: "STEPS",           icon: <Footprints size={16} />, accent: "#575279", label: "Steps" },
  { type: "SLEEP_DURATION",  icon: <Moon       size={16} />, accent: "#6B6492", label: "Sleep" },
  { type: "HEART_RATE",      icon: <HeartPulse size={16} />, accent: "#A0445C", label: "Heart Rate" },
  { type: "ACTIVE_CALORIES", icon: <Flame      size={16} />, accent: "#9A640F", label: "Calories" },
  { type: "DISTANCE_METERS", icon: <Route      size={16} />, accent: "#B07522", label: "Distance" },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Top-level period selector — drives cards + chart
  const [period, setPeriod] = useState<DateRangePeriod>("today");

  // Data state
  const [summaryData, setSummaryData] = useState<TrendResponse[]>([]);   // one per parameter, for the cards
  const [latestMetrics, setLatestMetrics] = useState<LatestMetric[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [sparklines, setSparklines] = useState<Record<ParameterType, number[]>>({} as Record<ParameterType, number[]>);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Trend chart state
  const [trendParam, setTrendParam] = useState<ParameterType>("STEPS");
  const [trendData, setTrendData] = useState<TrendResponse | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  // ── Load summary data for current period ────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const cfg = buildDateRangeConfig(period);

      const [latest, status, ...paramTrends] = await Promise.all([
        api.getLatestMetrics(),
        api.getSyncStatus(),
        // One trend call per parameter — these power the summary cards
        ...CARDS.map((c) =>
          api.getTrend(c.type, cfg.granularity, cfg.from, cfg.to).catch(() => null)
        ),
      ]);

      setLatestMetrics(latest);
      setSyncStatus(status);
      const trends = paramTrends.filter(Boolean) as TrendResponse[];
      setSummaryData(trends);

      // Sparklines want the last 7 daily points per parameter. If the
      // card data we just fetched is ALREADY daily-granularity and covers
      // at least 7 days (true for "last_week", our default), reuse it
      // directly instead of firing a second full round of 5 requests.
      // Only "yesterday" (too short a range) and "last_month" (weekly
      // buckets, not daily) still need a separate fetch.
      const canReuseForSparklines = cfg.granularity === "daily" && trends.some((t) => t.points.length >= 7);

      let sparklineSource: TrendResponse[];
      if (canReuseForSparklines) {
        sparklineSource = trends.map((t) => ({ ...t, points: t.points.slice(-7) }));
      } else {
        const sparklineFrom = dayAgo(7);
        const sparklineTo = today();
        const results = await Promise.all(
          CARDS.map((c) => api.getTrend(c.type, "daily", sparklineFrom, sparklineTo).catch(() => null))
        );
        sparklineSource = results.filter(Boolean) as TrendResponse[];
      }

      const next: Record<ParameterType, number[]> = {} as Record<ParameterType, number[]>;
      sparklineSource.forEach((t) => {
        next[t.parameterType] = t.points
          .filter((p) => p.hasData)
          .map((p) => (t.parameterType === "HEART_RATE" ? p.avgValue : p.totalValue) ?? 0);
      });
      setSparklines(next);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Something went wrong loading your dashboard.");
    } finally {
      setIsRefreshing(false);
      setHasLoadedOnce(true);
    }
  }, [period]);

  useEffect(() => {
    if (isAuthenticated) loadDashboard();
  }, [isAuthenticated, loadDashboard]);

  // ── Load trend chart for selected parameter + period ────────────────────────
  const loadTrend = useCallback(() => {
    if (!isAuthenticated) return;
    const cfg = buildDateRangeConfig(period);
    setTrendLoading(true);
    setTrendError(null);
    setTrendData(null);
    api
      .getTrend(trendParam, cfg.granularity, cfg.from, cfg.to)
      .then((d) => { setTrendData(d); setTrendLoading(false); })
      .catch((err) => {
        setTrendError(err instanceof ApiError ? err.message : "Couldn't load this chart.");
        setTrendLoading(false);
      });
  }, [isAuthenticated, trendParam, period]);

  useEffect(() => {
    loadTrend();
  }, [loadTrend]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (authLoading || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading…</div>;
  }

  const cfg = buildDateRangeConfig(period);
  const hasAnyData = summaryData.some((t) => t.points.some((p) => p.hasData));

  return (
    <div className="min-h-screen bg-bg">
      <TopBar
        status={syncStatus?.latestJob?.status ?? null}
        lastSuccessfulSyncAt={syncStatus?.lastSuccessfulSyncAt ?? null}
        onRefresh={loadDashboard}
        isRefreshing={isRefreshing}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* ── Period selector ── */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-[22px] text-ink-2">Your Health Dashboard</h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">{cfg.description}</p>
          </div>
          <PeriodSelector selected={period} onChange={(p) => { setPeriod(p); }} />
        </div>

        {!hasLoadedOnce ? (
          <div className="flex h-64 items-center justify-center text-ink-muted">Loading your data…</div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadDashboard} />
        ) : !hasAnyData ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Summary cards — totals/averages for the selected period ── */}
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CARDS.map((card) => {
                const trend = summaryData.find((t) => t.parameterType === card.type);
                // Aggregate across all points in the period
                const raw = getPeriodValue(card.type, trend);
                const caption = getPeriodCaption(card.type, trend, cfg.granularity);
                return (
                  <SummaryCard
                    key={card.type}
                    icon={card.icon}
                    label={card.label}
                    value={raw !== null ? formatValueForDisplay(card.type, raw) : null}
                    caption={caption}
                    accentColor={card.accent}
                    sparklineData={sparklines[card.type]}
                  />
                );
              })}
            </section>

            {/* ── Trend chart — reacts to both period AND parameter ── */}
            <section className="mb-6">
              {trendLoading ? (
                <div className="flex h-[320px] items-center justify-center rounded-card border border-border bg-surface text-ink-muted">
                  Loading chart…
                </div>
              ) : trendError ? (
                <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-card border border-denial-bd bg-denial-bg text-center">
                  <p className="text-[13.5px] text-denial-fg">{trendError}</p>
                  <button
                    onClick={loadTrend}
                    className="rounded-full border border-denial-bd bg-surface px-4 py-1.5 text-[13px] font-semibold text-denial-fg transition-colors hover:bg-denial-bg"
                  >
                    Try again
                  </button>
                </div>
              ) : trendData ? (
                <TrendChart
                  parameterType={trendParam}
                  onParameterChange={setTrendParam}
                  points={trendData.points}
                  granularity={cfg.granularity}
                  periodDescription={cfg.description}
                />
              ) : null}
            </section>

            {/* ── Latest readings ── */}
            <LatestMetrics metrics={latestMetrics} />
          </>
        )}
      </main>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * For the summary cards, aggregate across all data points in the period:
 * - HEART_RATE: record-count-weighted average across all points
 * - Everything else: sum all totalValues
 */
function getPeriodValue(type: ParameterType, trend: TrendResponse | undefined): number | null {
  if (!trend) return null;
  const withData = trend.points.filter((p) => p.hasData);
  if (withData.length === 0) return null;

  if (type === "HEART_RATE") {
    const totalRecords = withData.reduce((s, p) => s + p.recordCount, 0);
    if (totalRecords === 0) return null;
    const weighted = withData.reduce((s, p) => s + (p.avgValue ?? 0) * p.recordCount, 0);
    return Math.round(weighted / totalRecords);
  }

  const total = withData.reduce((s, p) => s + (p.totalValue ?? 0), 0);
  return total;
}

function getPeriodCaption(
  type: ParameterType,
  trend: TrendResponse | undefined,
  granularity: "daily" | "weekly"
): string | undefined {
  if (!trend) return undefined;
  const withData = trend.points.filter((p) => p.hasData);
  const days = withData.length;

  if (type === "HEART_RATE") return `avg over ${days} ${granularity === "daily" ? "day" : "week"}${days !== 1 ? "s" : ""}`;
  if (type === "SLEEP_DURATION") return `total over ${days} day${days !== 1 ? "s" : ""}`;
  return `total · ${days} day${days !== 1 ? "s" : ""}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}