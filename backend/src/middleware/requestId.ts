import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Every request gets a UUID, echoed back in the `X-Request-Id` response
 * header and included in error payloads / sync_errors rows. When a mobile
 * developer reports "my sync failed", this is the string that lets you
 * find the exact log line and exact sync_errors row in one query instead
 * of guessing by timestamp.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  req.requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
