import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  // env.JWT_EXPIRES_IN is validated at startup (env.ts) to be a real,
  // non-empty string like "7d" — zod just can't express jsonwebtoken's
  // narrower literal type (e.g. "7d" | "1h" | ...) for us, so this cast
  // bridges that gap without weakening the actual runtime validation.
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}
