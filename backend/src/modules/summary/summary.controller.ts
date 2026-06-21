import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as summaryService from "./summary.service";

export const dailySummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query as { date?: string };
  const data = await summaryService.getDailySummary(req.userId, date);
  res.status(200).json({ data });
});

export const latestMetricsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await summaryService.getLatestMetrics(req.userId);
  res.status(200).json({ data });
});

function trendHandlerFor(granularity: "daily" | "weekly" | "monthly") {
  return asyncHandler(async (req: Request, res: Response) => {
    const { parameterType, from, to } = req.query as { parameterType: any; from: string; to: string };
    const data = await summaryService.getTrend(req.userId, parameterType, granularity, from, to);
    res.status(200).json({ data });
  });
}

export const dailyTrendHandler = trendHandlerFor("daily");
export const weeklyTrendHandler = trendHandlerFor("weekly");
export const monthlyTrendHandler = trendHandlerFor("monthly");
