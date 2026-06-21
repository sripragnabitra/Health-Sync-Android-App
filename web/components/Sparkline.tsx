"use client";

interface SparklineProps {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}

/**
 * A bare trend line, no axes, no labels — same idea as the sparkline in
 * Independence OS's own KPI cards: at a glance, "is this going up or
 * down", nothing more. Renders nothing (rather than a flat misleading
 * line) when there isn't enough data yet.
 */
export function Sparkline({ points, color, width = 72, height = 28 }: SparklineProps) {
  const finite = points.filter((p) => Number.isFinite(p));
  if (finite.length < 2) return null;

  const max = Math.max(...finite);
  const min = Math.min(...finite);
  const range = max - min || 1;
  const step = width / (finite.length - 1);

  const coords = finite.map((p, i) => [i * step, height - ((p - min) / range) * height]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const last = coords[coords.length - 1];
  const gradientId = `spark-${color.replace("#", "")}`;

  return (
    <svg width={width} height={height} className="block" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} />
    </svg>
  );
}
