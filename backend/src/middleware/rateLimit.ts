import rateLimit from "express-rate-limit";

/** Auth endpoints get a tighter limit — they're the obvious brute-force target. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts. Try again later." } },
});

/** Looser default for everything else, mainly to blunt accidental retry storms. */
export const defaultRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests. Slow down." } },
});
