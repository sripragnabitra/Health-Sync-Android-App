import { ParameterType } from "./types";

export function formatInteger(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

/** Minutes -> "7h 12m". Used for sleep duration, which is stored in minutes. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

/** Meters -> "5.8 km" (or "320 m" for short distances, where km would round to 0.0). */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * The single headline string for a parameter's value, given its raw
 * stored unit. This is the one place that knows "steps are a bare count,
 * sleep is minutes-to-display-as-hours" — every card/list reuses it so two
 * parts of the UI never format the same number two different ways.
 */
export function formatValueForDisplay(parameterType: ParameterType, value: number): string {
  switch (parameterType) {
    case "STEPS":
      return formatInteger(value);
    case "DISTANCE_METERS":
      return formatDistance(value);
    case "ACTIVE_CALORIES":
      return `${formatInteger(value)} kcal`;
    case "HEART_RATE":
      return `${Math.round(value)} bpm`;
    case "SLEEP_DURATION":
      return formatDuration(value);
  }
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

export function formatClockTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
