"use client";

import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ParameterType, TrendPoint, PARAMETER_LABELS } from "@/lib/types";
import { formatValueForDisplay } from "@/lib/format";

interface TrendChartProps {
  parameterType: ParameterType;
  onParameterChange: (p: ParameterType) => void;
  points: TrendPoint[];
  granularity: "daily" | "weekly";
  periodDescription: string;
}

const PARAMETERS: ParameterType[] = [
  "STEPS", "SLEEP_DURATION", "HEART_RATE", "ACTIVE_CALORIES", "DISTANCE_METERS",
];

const PRIMARY = "#575279";
const AMBER = "#9A640F";

function bucketLabel(point: TrendPoint, granularity: "daily" | "weekly"): string {
  const start = new Date(`${point.bucketStart}T00:00:00Z`);
  if (granularity === "daily") {
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // weekly — show "Jun 8–14"
  const end = new Date(`${point.bucketEnd}T00:00:00Z`);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${end.toLocaleDateString("en-US", { day: "numeric" })}`;
}

export function TrendChart({
  parameterType,
  onParameterChange,
  points,
  granularity,
  periodDescription,
}: TrendChartProps) {
  const isHeartRate = parameterType === "HEART_RATE";
  const hasAnyData = points.some((p) => p.hasData);

  const data = points.map((p) => ({
    label: bucketLabel(p, granularity),
    value: isHeartRate ? p.avgValue : p.totalValue,
    hasData: p.hasData,
  }));

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      {/* Header row: title + period description */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-serif text-[19px] text-ink-2">Trends</h3>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">{periodDescription}</p>
        </div>
      </div>

      {/* Parameter pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {PARAMETERS.map((p) => (
          <button
            key={p}
            onClick={() => onParameterChange(p)}
            className={`rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors ${
              parameterType === p
                ? "border-ink bg-ink text-ink-onDark"
                : "border-border bg-surface text-ink-muted hover:bg-surface-muted"
            }`}
          >
            {PARAMETER_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Chart */}
      {!hasAnyData ? (
        <div className="flex h-[240px] items-center justify-center text-[13.5px] text-ink-muted">
          No synced data for this period yet.
        </div>
      ) : isHeartRate ? (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8DFC8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#67617F" }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#67617F" }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              formatter={(v: number) => [formatValueForDisplay(parameterType, v), "Avg bpm"]}
              contentStyle={{ borderRadius: 10, border: "1px solid #DCD3BE", fontSize: 13 }}
            />
            <Line type="monotone" dataKey="value" stroke={PRIMARY} strokeWidth={2}
              dot={{ r: 3, fill: PRIMARY }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8DFC8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#67617F" }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#67617F" }} axisLine={false} tickLine={false} width={42} />
            <Tooltip
              formatter={(v: number) => [formatValueForDisplay(parameterType, v), "Total"]}
              contentStyle={{ borderRadius: 10, border: "1px solid #DCD3BE", fontSize: 13 }}
            />
            <Bar dataKey="value" fill={AMBER} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
