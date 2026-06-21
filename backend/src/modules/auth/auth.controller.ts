import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";

export const signupHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  res.status(201).json({ data: result });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json({ data: result });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.getUserProfile(req.userId);
  res.status(200).json({ data: profile });
});
