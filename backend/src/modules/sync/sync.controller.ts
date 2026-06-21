import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as syncService from "./sync.service";

export const ingestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId, trigger, records } = req.body;
  const summary = await syncService.ingestHealthRecords(req.userId, deviceId, trigger, records);
  res.status(200).json({ data: summary });
});

export const syncStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const status = await syncService.getSyncStatus(req.userId);
  res.status(200).json({ data: status });
});
