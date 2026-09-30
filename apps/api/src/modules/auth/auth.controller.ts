import type { Request, Response } from "express";
import {
  registerInputSchema,
  loginInputSchema,
  forgotPasswordInputSchema,
  resetPasswordInputSchema,
} from "@job-kanban/shared";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";
import { parseBody } from "../../utils/validation.js";
import {
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "../../utils/cookies.js";

function sendAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);
}

export class AuthController {
  private authService = new AuthService(new AuthRepository());

  register = async (
    req: Request,
    res: Response,
    onUserCreated?: (userId: number) => Promise<unknown>,
  ) => {
    const input = parseBody(registerInputSchema, req, res);
    if (!input) {
      return;
    }

    const user = await this.authService.register(input);

    // Seeding is a convenience, not part of making an account: if it fails the
    // account still exists and still works, so a broken sample board cannot
    // stop someone signing up.
    if (onUserCreated) {
      try {
        await onUserCreated(user.id);
      } catch (error) {
        console.error("Failed to seed the sample board", error);
      }
    }

    res.status(201).json({ user });
  };

  login = async (req: Request, res: Response) => {
    const input = parseBody(loginInputSchema, req, res);
    if (!input) {
      return;
    }

    const tokens = await this.authService.login(input);
    sendAuthCookies(res, tokens);

    res.json({ user: tokens.user });
  };

  getCurrentUser = async (req: Request, res: Response) => {
    const user = await this.authService.getCurrentUser(req.user!.id);

    if (!user) {
      res.status(401).json({ message: "User no longer exists" });
      return;
    }

    res.json({ user });
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (typeof refreshToken !== "string" || !refreshToken) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    try {
      const tokens = await this.authService.refresh(refreshToken);
      sendAuthCookies(res, tokens);
      res.json({ user: tokens.user });
    } catch (error) {
      // A dead refresh token means the session is over: drop the cookies so
      // the browser stops sending them.
      clearAuthCookies(res);
      throw error;
    }
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (typeof refreshToken === "string" && refreshToken) {
      await this.authService.logout(refreshToken);
    }
    clearAuthCookies(res);
    res.status(204).send();
  };

  forgotPassword = async (req: Request, res: Response) => {
    const input = parseBody(forgotPasswordInputSchema, req, res);
    if (!input) {
      return;
    }

    await this.authService.requestPasswordReset(input);

    // The same response whether or not the address is registered.
    res.json({
      message:
        "If an account exists for that email, a reset link is on its way",
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const input = parseBody(resetPasswordInputSchema, req, res);
    if (!input) {
      return;
    }

    await this.authService.resetPassword(input);
    res.json({ message: "Your password has been reset. You can log in now" });
  };
}
