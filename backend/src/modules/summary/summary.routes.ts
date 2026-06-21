import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { dailyQuerySchema, trendQuerySchema } from "./summary.schema";
import {
  dailySummaryHandler,
  latestMetricsHandler,
  dailyTrendHandler,
  weeklyTrendHandler,
  monthlyTrendHandler,
} from "./summary.controller";

export const summaryRouter = Router();

summaryRouter.use(requireAuth);
summaryRouter.get("/daily", validate(dailyQuerySchema, "query"), dailySummaryHandler);
summaryRouter.get("/latest", latestMetricsHandler);
summaryRouter.get("/trend/daily", validate(trendQuerySchema, "query"), dailyTrendHandler);
summaryRouter.get("/trend/weekly", validate(trendQuerySchema, "query"), weeklyTrendHandler);
summaryRouter.get("/trend/monthly", validate(trendQuerySchema, "query"), monthlyTrendHandler);
