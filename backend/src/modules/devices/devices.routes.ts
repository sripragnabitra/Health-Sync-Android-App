import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { registerDeviceSchema } from "./devices.schema";
import { registerDeviceHandler, listDevicesHandler } from "./devices.controller";

export const devicesRouter = Router();

devicesRouter.use(requireAuth);
devicesRouter.post("/", validate(registerDeviceSchema), registerDeviceHandler);
devicesRouter.get("/", listDevicesHandler);
