import { describe, it, expect } from "vitest";

import {
  apiErrorSchema,
  healthResponseSchema,
  validationErrorSchema,
} from "./api.schema.js";

/**
 * These describe the envelopes errorHandler and /health produce. They are
 * what the frontend reads when a request fails, so the optional-vs-required
 * distinction matters: code is absent on unexpected 500s, present on the ones
 * a client is meant to handle.
 */

describe("apiErrorSchema", () => {
  it("accepts the shape the errorHandler sends for an HttpError", () => {
    const body = { message: "Invalid credentials", code: "INVALID_CREDENTIALS" };

    expect(apiErrorSchema.safeParse(body).success).toBe(true);
  });

  it("accepts a generic 500 body that carries no code", () => {
    const body = { message: "Internal Server Error" };

    expect(apiErrorSchema.parse(body)).toEqual(body);
  });

  it("requires a message", () => {
    expect(apiErrorSchema.safeParse({ code: "SOMETHING" }).success).toBe(false);
  });
});

describe("validationErrorSchema", () => {
  it("accepts a per-field issue list for form highlighting", () => {
    const body = {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      issues: [
        { field: "email", message: "Enter a valid email address" },
        { field: "password", message: "Password is required" },
      ],
    };

    expect(validationErrorSchema.safeParse(body).success).toBe(true);
  });

  it("requires issues to be present", () => {
    expect(
      validationErrorSchema.safeParse({ message: "Validation failed" }).success,
    ).toBe(false);
  });

  it("rejects an issue that is missing its field or message", () => {
    const result = validationErrorSchema.safeParse({
      message: "Validation failed",
      issues: [{ field: "email" }],
    });

    expect(result.success).toBe(false);
  });
});

describe("healthResponseSchema", () => {
  it("accepts the body /health returns", () => {
    const body = { message: "Server is healthy", status: "OK" };

    expect(healthResponseSchema.safeParse(body).success).toBe(true);
  });

  it("rejects a degraded status", () => {
    expect(healthResponseSchema.safeParse({ message: "down", status: "DOWN" }).success).toBe(
      false,
    );
  });
});
