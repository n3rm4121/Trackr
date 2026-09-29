import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";
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

  register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      res
        .status(400)
        .json({ message: "email, password and name are required" });
      return;
    }

    const user = await this.authService.register({ email, password, name });
    res.status(201).json({ user });
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const tokens = await this.authService.login({ email, password });
    sendAuthCookies(res, tokens);

    // Only the user is in the body. Tokens live in httpOnly cookies that
    // JavaScript cannot read.
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
}
