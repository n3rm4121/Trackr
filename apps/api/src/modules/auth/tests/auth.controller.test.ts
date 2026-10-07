import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { AuthController } from "../auth.controller.js";
import { AuthService } from "../auth.service.js";
import {
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "../../../utils/cookies.js";

vi.mock("../auth.service.js");
vi.mock("../../../utils/cookies.js");

let serviceInstance: AuthService;

vi.mocked(AuthService).mockImplementation(function () {
  return serviceInstance;
} as never);

describe("AuthController", () => {
  let controller: AuthController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    serviceInstance = {
      register: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      changePassword: vi.fn(),
    } as unknown as AuthService;

    controller = new AuthController();

    // Default mock Express response object with chaining support
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe("register", () => {
    it("should return 400 with per-field issues if required fields are missing", async () => {
      mockReq = {
        body: { email: "test@example.com" }, // missing password and name
      };

      await controller.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        issues: [
          {
            field: "password",
            message: "Invalid input: expected string, received undefined",
          },
          {
            field: "name",
            message: "Invalid input: expected string, received undefined",
          },
        ],
      });
      expect(serviceInstance.register).not.toHaveBeenCalled();
    });

    it("should reject a malformed email with the shared schema's message", async () => {
      mockReq = {
        body: { email: "not-an-email", password: "password123", name: "Test" },
      };

      await controller.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        issues: [
          { field: "email", message: "Enter a valid email address" },
        ],
      });
      expect(serviceInstance.register).not.toHaveBeenCalled();
    });

    it("should normalise the email before it reaches the service", async () => {
      vi.mocked(serviceInstance.register).mockResolvedValueOnce({
        id: 1,
        email: "test@example.com",
        name: "Test",
      } as any);

      mockReq = {
        body: {
          email: "  Test@Example.COM ",
          password: "password123",
          name: "Test",
        },
      };

      await controller.register(mockReq as Request, mockRes as Response);

      expect(serviceInstance.register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        name: "Test",
      });
    });

    it("should register user and return 201 with user data", async () => {
      const mockUser = { id: "1", email: "test@example.com", name: "Test" };
      vi.mocked(serviceInstance.register).mockResolvedValueOnce(
        mockUser as any,
      );

      mockReq = {
        body: {
          email: "test@example.com",
          password: "password123",
          name: "Test",
        },
      };

      await controller.register(mockReq as Request, mockRes as Response);

      expect(serviceInstance.register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        name: "Test",
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });

  describe("login", () => {
    it("should return 400 with per-field issues if email or password are missing", async () => {
      mockReq = {
        body: { email: "test@example.com" }, // missing password
      };

      await controller.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        issues: [
          {
            field: "password",
            message: "Invalid input: expected string, received undefined",
          },
        ],
      });
    });

    it("should login user, set cookies, and return user object", async () => {
      const mockTokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { id: "1", email: "test@example.com" },
      };
      vi.mocked(serviceInstance.login).mockResolvedValueOnce(mockTokens as any);

      mockReq = {
        body: { email: "test@example.com", password: "password123" },
      };

      await controller.login(mockReq as Request, mockRes as Response);

      expect(serviceInstance.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(setAccessCookie).toHaveBeenCalledWith(mockRes, "access-token");
      expect(setRefreshCookie).toHaveBeenCalledWith(mockRes, "refresh-token");
      expect(mockRes.json).toHaveBeenCalledWith({ user: mockTokens.user });
    });
  });

  describe("getCurrentUser", () => {
    it("should return 401 if user no longer exists", async () => {
      vi.mocked(serviceInstance.getCurrentUser).mockResolvedValueOnce(
        null as any,
      );

      mockReq = {
        user: { id: "non-existent" } as any,
      };

      await controller.getCurrentUser(mockReq as Request, mockRes as Response);

      expect(serviceInstance.getCurrentUser).toHaveBeenCalledWith(
        "non-existent",
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User no longer exists",
      });
    });

    it("should return user if found", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      vi.mocked(serviceInstance.getCurrentUser).mockResolvedValueOnce(
        mockUser as any,
      );

      mockReq = {
        user: { id: "1" } as any,
      };

      await controller.getCurrentUser(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });

  describe("refresh", () => {
    it("should return 401 if no refresh cookie is present", async () => {
      mockReq = {
        cookies: {},
      };

      await controller.refresh(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "No refresh token",
      });
    });

    it("should refresh tokens successfully and set new cookies", async () => {
      const mockTokens = {
        accessToken: "new-access",
        refreshToken: "new-refresh",
        user: { id: "1" },
      };
      vi.mocked(serviceInstance.refresh).mockResolvedValueOnce(
        mockTokens as any,
      );

      mockReq = {
        cookies: { [REFRESH_COOKIE]: "valid-refresh-token" },
      };

      await controller.refresh(mockReq as Request, mockRes as Response);

      expect(serviceInstance.refresh).toHaveBeenCalledWith(
        "valid-refresh-token",
      );
      expect(setAccessCookie).toHaveBeenCalledWith(mockRes, "new-access");
      expect(setRefreshCookie).toHaveBeenCalledWith(mockRes, "new-refresh");
      expect(mockRes.json).toHaveBeenCalledWith({ user: mockTokens.user });
    });

    it("should clear cookies and throw error if refresh fails", async () => {
      const mockError = new Error("Invalid token");
      vi.mocked(serviceInstance.refresh).mockRejectedValueOnce(mockError);

      mockReq = {
        cookies: { [REFRESH_COOKIE]: "expired-token" },
      };

      await expect(
        controller.refresh(mockReq as Request, mockRes as Response),
      ).rejects.toThrow("Invalid token");

      expect(clearAuthCookies).toHaveBeenCalledWith(mockRes);
    });
  });

  describe("logout", () => {
    // Stateless: signing out is dropping the cookies. No service call, with
    // or without a refresh cookie present.
    it("clears cookies and sends 204 when a refresh cookie exists", async () => {
      mockReq = {
        cookies: { [REFRESH_COOKIE]: "some-refresh-token" },
      };

      await controller.logout(mockReq as Request, mockRes as Response);

      expect(serviceInstance.logout).not.toHaveBeenCalled();
      expect(clearAuthCookies).toHaveBeenCalledWith(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("clears cookies and sends 204 when no refresh cookie exists", async () => {
      mockReq = {
        cookies: {},
      };

      await controller.logout(mockReq as Request, mockRes as Response);

      expect(serviceInstance.logout).not.toHaveBeenCalled();
      expect(clearAuthCookies).toHaveBeenCalledWith(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    it("should return 400 with per-field issues if email is missing or malformed", async () => {
      mockReq = { body: { email: "not-an-email" } };

      await controller.forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        issues: [{ field: "email", message: "Enter a valid email address" }],
      });
      expect(serviceInstance.requestPasswordReset).not.toHaveBeenCalled();
    });

    it("should normalise the email before it reaches the service", async () => {
      mockReq = { body: { email: "  Test@Example.COM " } };

      await controller.forgotPassword(mockReq as Request, mockRes as Response);

      expect(serviceInstance.requestPasswordReset).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });

    /**
     * A different status or body for an unknown address would leak which
     * emails are registered, so the controller always answers the same way.
     */
    it("should acknowledge the request without revealing whether the account exists", async () => {
      mockReq = { body: { email: "nobody@example.com" } };

      await controller.forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).not.toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "If an account exists for that email, a reset link is on its way",
      });
    });
  });

  describe("resetPassword", () => {
    it("should return 400 with per-field issues if token or password are missing", async () => {
      mockReq = { body: { token: "a-token" } };

      await controller.resetPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        issues: [
          {
            field: "password",
            message: "Invalid input: expected string, received undefined",
          },
        ],
      });
      expect(serviceInstance.resetPassword).not.toHaveBeenCalled();
    });

    it("should confirm the reset on success", async () => {
      vi.mocked(serviceInstance.resetPassword).mockResolvedValueOnce(
        undefined as any,
      );
      mockReq = { body: { token: "a-token", password: "new-password-1" } };

      await controller.resetPassword(mockReq as Request, mockRes as Response);

      expect(serviceInstance.resetPassword).toHaveBeenCalledWith({
        token: "a-token",
        password: "new-password-1",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Your password has been reset. You can log in now",
      });
    });

    it("should surface the service's rejection for an invalid token", async () => {
      vi.mocked(serviceInstance.resetPassword).mockRejectedValueOnce(
        Object.assign(new Error("Invalid or expired reset link"), {
          status: 400,
          code: "INVALID_RESET_TOKEN",
        }),
      );
      mockReq = { body: { token: "stale", password: "new-password-1" } };

      await expect(
        controller.resetPassword(mockReq as Request, mockRes as Response),
      ).rejects.toMatchObject({ code: "INVALID_RESET_TOKEN" });
    });
  });

  describe("changePassword", () => {
    it("should pass the signed-in user's id and the parsed body to the service", async () => {
      vi.mocked(serviceInstance.changePassword).mockResolvedValueOnce(
        undefined as any,
      );
      mockReq = {
        user: { id: 42 } as any,
        body: { currentPassword: "correct-horse", newPassword: "brand-new-password" },
      };

      await controller.changePassword(mockReq as Request, mockRes as Response);

      expect(serviceInstance.changePassword).toHaveBeenCalledWith(42, {
        currentPassword: "correct-horse",
        newPassword: "brand-new-password",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Your password has been changed",
      });
    });

    it("should return 400 and not call the service when the new password matches", async () => {
      mockReq = {
        user: { id: 42 } as any,
        body: { currentPassword: "same-password-1", newPassword: "same-password-1" },
      };

      await controller.changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(serviceInstance.changePassword).not.toHaveBeenCalled();
    });

    it("should return 400 with per-field issues when the current password is missing", async () => {
      mockReq = {
        user: { id: 42 } as any,
        body: { newPassword: "brand-new-password" },
      };

      await controller.changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(serviceInstance.changePassword).not.toHaveBeenCalled();
    });
  });
});
