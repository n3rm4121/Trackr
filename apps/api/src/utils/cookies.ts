import type { Response } from "express";
import config from "../config/config.js";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// The API is served under the /api path prefix (see the top-level rewrites in
// vercel.json), so the refresh cookie must live under that prefix too. A
// browser only sends a cookie to paths beneath its Path, so Path=/auth would
// never ride along on requests to /api/auth/refresh.

const REFRESH_COOKIE_PATH = "/api/auth";

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
