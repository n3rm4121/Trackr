import { describe, it, expect } from "vitest";

import {
  emailSchema,
  passwordSchema,
  userNameSchema,
  userSchema,
} from "./user.schema.js";

/**
 * These schemas are the contract both the API and the web app validate
 * against, so the edge cases pinned here are the ones that would otherwise
 * only surface as a bug on one side: normalisation, whitespace-only input, and
 * the password rules.
 */

describe("emailSchema", () => {
  it("accepts an ordinary address", () => {
    expect(emailSchema.safeParse("person@example.com").success).toBe(true);
  });

  it("lowercases so that addresses differing only in case are one account", () => {
    const result = emailSchema.safeParse("Person@Example.COM");

    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe("person@example.com");
  });

  it("trims surrounding whitespace before validating", () => {
    // The reason this is a pipe rather than z.email().trim(): a chained
    // transform would run after the format check and reject this input.
    const result = emailSchema.safeParse("  person@example.com  ");

    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe("person@example.com");
  });

  it.each([
    ["no at sign", "person.example.com"],
    ["no domain", "person@"],
    ["no local part", "@example.com"],
    ["empty", ""],
    ["whitespace only", "   "],
  ])("rejects an address with %s", (_label, input) => {
    expect(emailSchema.safeParse(input).success).toBe(false);
  });
});

describe("userNameSchema", () => {
  it("trims and accepts a normal name", () => {
    const result = userNameSchema.safeParse("  Nirmal  ");

    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe("Nirmal");
  });

  it("rejects whitespace-only, which min(1) alone would allow", () => {
    const result = userNameSchema.safeParse("   ");

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });

  it("rejects a name longer than the column", () => {
    expect(userNameSchema.safeParse("a".repeat(101)).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts a password at the minimum length", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });

  it("rejects a short password with an actionable message", () => {
    const result = passwordSchema.safeParse("short");

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("preserves leading and trailing spaces", () => {
    // Spaces are legal password characters. Trimming them would let a user
    // set a password they cannot reproduce at the login form.
    const result = passwordSchema.safeParse("  pass1234  ");

    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe("  pass1234  ");
  });

  it("rejects beyond bcrypt's 72-byte limit", () => {
    const result = passwordSchema.safeParse("a".repeat(73));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("72");
  });
});

describe("userSchema", () => {
  const valid = { id: 1, email: "Person@Example.com", name: "Nirmal" };

  it("accepts a valid user and normalises the email", () => {
    const result = userSchema.safeParse(valid);

    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe("person@example.com");
  });

  it("rejects a non-integer id", () => {
    expect(userSchema.safeParse({ ...valid, id: 1.5 }).success).toBe(false);
  });

  it("reports every offending field at once", () => {
    const result = userSchema.safeParse({ id: "x", email: "nope" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      "id",
      "email",
      "name",
    ]);
  });
});
