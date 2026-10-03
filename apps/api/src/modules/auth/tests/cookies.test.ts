import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import type { Response } from "express";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
} from "../../../utils/cookies.js";

/**
 * These tests assert the exact cookie options, because the security
 * properties live here: httpOnly keeps tokens out of reach of JavaScript,
 * and the refresh cookie's /api/auth path stops the long-lived credential from
 * riding along on ordinary API calls.
 */
describe("cookie helpers", () => {
  let res: Partial<Response>;

  beforeEach(() => {
    res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    };
  });

  type CookieOptions = { path?: string; maxAge?: number; httpOnly?: boolean };

  const cookieMock = () => res.cookie as unknown as Mock;

  const optionsFor = (name: string): CookieOptions | undefined => {
    const call = cookieMock().mock.calls.find(
      (args: unknown[]) => args[0] === name,
    );
    return call?.[2] as CookieOptions | undefined;
  };

  describe("setAccessCookie", () => {
    it("sets the token httpOnly so JavaScript cannot read it", () => {
      setAccessCookie(res as Response, "access-value");

      expect(optionsFor(ACCESS_COOKIE)).toMatchObject({ httpOnly: true });
    });

    it("scopes the cookie to the whole site so it rides on API calls", () => {
      setAccessCookie(res as Response, "access-value");

      expect(optionsFor(ACCESS_COOKIE)).toMatchObject({ path: "/" });
    });

    it("expires after 15 minutes, matching the token lifetime", () => {
      setAccessCookie(res as Response, "access-value");

      expect(optionsFor(ACCESS_COOKIE)).toMatchObject({
        maxAge: 15 * 60 * 1000,
      });
    });

    it("sets the cookie under the access cookie name", () => {
      setAccessCookie(res as Response, "access-value");

      expect(res.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE,
        "access-value",
        expect.any(Object),
      );
    });
  });

  describe("setRefreshCookie", () => {
    it("sets the token httpOnly", () => {
      setRefreshCookie(res as Response, "refresh-value");

      expect(optionsFor(REFRESH_COOKIE)).toMatchObject({ httpOnly: true });
    });

    it("scopes the cookie to /api/auth only", () => {
      setRefreshCookie(res as Response, "refresh-value");

      expect(optionsFor(REFRESH_COOKIE)).toMatchObject({ path: "/api/auth" });
    });

    it("uses a longer lifetime than the access token", () => {
      setRefreshCookie(res as Response, "refresh-value");

      const refreshMaxAge = optionsFor(REFRESH_COOKIE)?.maxAge as number;
      const accessMaxAge = 15 * 60 * 1000;

      expect(refreshMaxAge).toBeGreaterThan(accessMaxAge);
    });
  });

  describe("clearAuthCookies", () => {
    it("clears both cookies", () => {
      clearAuthCookies(res as Response);

      expect(res.clearCookie).toHaveBeenCalledWith(
        ACCESS_COOKIE,
        expect.any(Object),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        REFRESH_COOKIE,
        expect.any(Object),
      );
    });

    /**
     * A browser only removes a cookie if the clearing request matches its
     * name, path and domain. A mismatched path silently fails and the user
     * stays logged in, so each cookie must be cleared with the path it was
     * set with.
     */
    it("clears each cookie with the same path it was set with", () => {
      clearAuthCookies(res as Response);

      const paths = vi
        .mocked(res.clearCookie!)
        .mock.calls.map(([, options]) => (options as { path?: string })?.path);

      expect(paths).toContain("/");
      expect(paths).toContain("/api/auth");
    });

    it("keeps httpOnly consistent with how the cookies were set", () => {
      clearAuthCookies(res as Response);

      for (const [, options] of vi.mocked(res.clearCookie!).mock.calls) {
        expect(options).toMatchObject({ httpOnly: true });
      }
    });
  });

  describe("security flags", () => {
    it("marks every cookie sameSite lax to limit cross-site sending", () => {
      setAccessCookie(res as Response, "a");
      setRefreshCookie(res as Response, "b");

      for (const call of cookieMock().mock.calls) {
        expect(call[2]).toMatchObject({ sameSite: "lax" });
      }
    });

    it("does not mark cookies secure in development, so http works locally", () => {
      // config.cookieSecure tracks NODE_ENV; a browser rejects Secure cookies
      // on plain http://localhost.
      setAccessCookie(res as Response, "a");

      expect(optionsFor(ACCESS_COOKIE)).toMatchObject({ secure: false });
    });
  });
});
