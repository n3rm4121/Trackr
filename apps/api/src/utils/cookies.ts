import type { Response } from "express";
import config from "../config/config.js";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// The path for the refresh token cookie is set to /auth so that it is only sent
// to the refresh endpoint. This is a security measure to prevent the refresh token
// from being sent to other endpoints where it is not needed.

const REFRESH_COOKIE_PATH = "/auth";

function baseOptions() {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax" as const,
  };
}

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE, token, {
    ...baseOptions(),
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: config.refreshTokenTtlMs,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: "/" });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
  });
}
