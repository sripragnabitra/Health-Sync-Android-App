import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { ingestSchema } from "./sync.schema";
import { ingestHandler, syncStatusHandler } from "./sync.controller";

export const syncRouter = Router();

syncRouter.use(requireAuth);
// A "manual re-sync" tap in the app is simply a call to this same endpoint —
// there's no separate trigger/ingest split, because the client always has
// fresh Health Connect data in hand by the time it calls this.
syncRouter.post("/health-records", validate(ingestSchema), ingestHandler);
syncRouter.get("/status", syncStatusHandler);
