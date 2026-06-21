import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { authRateLimiter } from "../../middleware/rateLimit";
import { signupSchema, loginSchema } from "./auth.schema";
import { signupHandler, loginHandler, meHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/signup", authRateLimiter, validate(signupSchema), signupHandler);
authRouter.post("/login", authRateLimiter, validate(loginSchema), loginHandler);
authRouter.get("/me", requireAuth, meHandler);
