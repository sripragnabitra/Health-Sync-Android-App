/**
 * Deliberately minimal — a real deployment would swap this for pino/winston
 * shipping to a log aggregator. The call sites (`logger.info(...)`,
 * `logger.error(...)`) are written so that swap is a one-file change.
 */
type LogFields = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, fields?: LogFields) {
  const line = { level, message, time: new Date().toISOString(), ...fields };
  // eslint-disable-next-line no-console
  console[level === "info" ? "log" : level](JSON.stringify(line));
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
