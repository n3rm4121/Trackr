import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/token.js";
import { ACCESS_COOKIE } from "../utils/cookies.js";

export interface AuthUser {
  id: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Reads the access token from the httpOnly cookie, verifies it, and attaches
 * the user to `req.user` for downstream handlers.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[ACCESS_COOKIE];

  if (typeof token !== "string" || !token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
