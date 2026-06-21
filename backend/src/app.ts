import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { requestId } from "./middleware/requestId";
import { defaultRateLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { devicesRouter } from "./modules/devices/devices.routes";
import { syncRouter } from "./modules/sync/sync.routes";
import { summaryRouter } from "./modules/summary/summary.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  // CORS_ORIGIN supports a comma-separated list — e.g.
  // "https://healthsync.vercel.app,http://localhost:3000" — so the deployed
  // backend can serve both the production dashboard and a developer's local
  // one without needing a redeploy to add/remove an origin.
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "2mb" })); // a 5000-record sync batch fits comfortably under this
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(requestId);
  app.use(defaultRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  const apiV1 = express.Router();
  apiV1.use("/auth", authRouter);
  apiV1.use("/devices", devicesRouter);
  apiV1.use("/sync", syncRouter);
  apiV1.use("/summary", summaryRouter);
  app.use("/api/v1", apiV1);

  app.use(notFoundHandler);
  app.use(errorHandler); // must be last — Express identifies error middleware by arity

  return app;
}
