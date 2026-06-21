import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import { signAccessToken } from "../../utils/jwt";
import { LoginInput, SignupInput } from "./auth.schema";

export interface AuthResult {
  token: string;
  user: { id: string; email: string; fullName: string | null };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("CONFLICT", "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, fullName: input.fullName },
  });

  const token = signAccessToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, fullName: user.fullName } };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Deliberately identical error for "no such user" and "wrong password" —
  // distinguishing them tells an attacker which emails are registered.
  const invalidCredentials = () => new AppError("UNAUTHORIZED", "Invalid email or password");

  if (!user) throw invalidCredentials();

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw invalidCredentials();

  const token = signAccessToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, fullName: user.fullName } };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("NOT_FOUND", "User not found");
  return { id: user.id, email: user.email, fullName: user.fullName, createdAt: user.createdAt };
}
