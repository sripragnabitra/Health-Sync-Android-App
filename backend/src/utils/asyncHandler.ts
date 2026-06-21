import { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express does not catch rejected promises from async route handlers on its
 * own — an unhandled rejection just hangs the request. Wrapping every async
 * handler with this forwards thrown/rejected errors into the centralized
 * error middleware instead of crashing or hanging silently.
 */
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
