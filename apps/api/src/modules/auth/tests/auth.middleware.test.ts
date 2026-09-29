import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireAuth } from "../../../middleware/auth.middleware.js";
import { ACCESS_COOKIE } from "../../../utils/cookies.js";
import { generateAccessToken } from "../../../utils/token.js";

/**
 * This middleware guards every authenticated route, so its failure modes are
 * worth pinning down: a bad or missing token must 401, and a valid token must
 * populate req.user and call next().
 */
describe("requireAuth", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  const run = (token?: string) => {
    mockReq = { cookies: token ? { [ACCESS_COOKIE]: token } : {} };
    requireAuth(mockReq as Request, mockRes as Response, next as NextFunction);
  };

  it("rejects the request with 401 when no access cookie is present", () => {
    run();

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token that is not a valid JWT", () => {
    run("not-a-real-token");

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a well-formed token signed with the wrong secret", () => {
    run(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
        "eyJ1c2VySWQiOjF9.wrong-signature",
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes the request through for a valid token", () => {
    run(generateAccessToken(42));

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("populates req.user from the token payload", () => {
    run(generateAccessToken(42));

    expect(mockReq.user).toEqual({ id: 42 });
  });

  it("does not trust a userId supplied by the caller", () => {
    mockReq = {
      cookies: { [ACCESS_COOKIE]: generateAccessToken(7) },
      user: { id: 999 },
    };

    requireAuth(mockReq as Request, mockRes as Response, next as NextFunction);

    expect(mockReq.user).toEqual({ id: 7 });
  });

  it("does not attach a user when rejecting", () => {
    run("bad-token");

    expect(mockReq.user).toBeUndefined();
  });
});
