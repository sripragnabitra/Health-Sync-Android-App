import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as devicesService from "./devices.service";

export const registerDeviceHandler = asyncHandler(async (req: Request, res: Response) => {
  const device = await devicesService.registerOrUpdateDevice(req.userId, req.body);
  res.status(200).json({ data: device });
});

export const listDevicesHandler = asyncHandler(async (req: Request, res: Response) => {
  const devices = await devicesService.listDevices(req.userId);
  res.status(200).json({ data: devices });
});
