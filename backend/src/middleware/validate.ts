import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

type Target = "body" | "query" | "params";

/**
 * Validates and *replaces* req[target] with the parsed-and-coerced result,
 * so handlers downstream get typed, trusted data — query params arrive as
 * strings off the wire, but a schema with z.coerce.number() means the
 * controller sees real numbers, not stringly-typed everything.
 */
export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw new AppError("VALIDATION_ERROR", "Request validation failed", result.error.flatten());
    }
    req[target] = result.data;
    next();
  };
}
