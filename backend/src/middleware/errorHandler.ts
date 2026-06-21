import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

/**
 * Single place where every error in the app becomes an HTTP response.
 * Route handlers and services just `throw new AppError(...)` (or let an
 * unexpected error bubble up) — nothing downstream needs its own
 * try/catch-and-format-response boilerplate.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId ?? "unknown";

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { requestId, code: err.code });
    }
    const body: ErrorResponseBody = {
      error: { code: err.code, message: err.message, requestId, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unique constraint violation that slipped past application-level checks
  // (e.g. a race between two concurrent signups with the same email).
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      error: { code: "CONFLICT", message: "Resource already exists", requestId },
    });
    return;
  }

  logger.error("Unhandled error", {
    requestId,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  const body: ErrorResponseBody = {
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Something went wrong" : err instanceof Error ? err.message : String(err),
      requestId,
    },
  };
  res.status(500).json(body);
}

/** Mounted after all routes — anything that reaches here matched no route. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}`, requestId: req.requestId },
  });
}
