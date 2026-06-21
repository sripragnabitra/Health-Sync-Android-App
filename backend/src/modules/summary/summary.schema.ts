import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const dailyQuerySchema = z.object({
  date: isoDate.optional(),
});

export const trendQuerySchema = z
  .object({
    parameterType: z.enum(["STEPS", "DISTANCE_METERS", "ACTIVE_CALORIES", "HEART_RATE", "SLEEP_DURATION"]),
    from: isoDate,
    to: isoDate,
  })
  .refine((v) => v.from <= v.to, { message: "`from` must be on or before `to`", path: ["from"] })
  .refine((v) => {
    const days = (new Date(v.to).getTime() - new Date(v.from).getTime()) / 86_400_000;
    return days <= 366;
  }, { message: "Range too large — max 366 days per request", path: ["to"] });

export type DailyQuery = z.infer<typeof dailyQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
