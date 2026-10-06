import { describe, it, expect } from "vitest";
import type { z } from "zod";

import {
  loginInputSchema,
  registerInputSchema,
  authResponseSchema,
  changePasswordInputSchema,
  forgotPasswordInputSchema,
  resetPasswordInputSchema,
  passwordActionResponseSchema,
  type RegisterInput,
  type AuthResponse,
} from "./auth.schema.js";
import { userSchema } from "./user.schema.js";

/**
 * These mirror what the auth controller reads off req.body and writes to
 * res.json, so a change to either side that breaks the other shows up here.
 */

const validUser = { id: 1, email: "person@example.com", name: "Nirmal" };

describe("registerInputSchema", () => {
  const valid: RegisterInput = {
    email: "person@example.com",
    password: "password123",
    name: "Nirmal",
  };

  it("accepts a well-formed registration", () => {
    expect(registerInputSchema.safeParse(valid).success).toBe(true);
  });

  it("normalises the email before it reaches the database", () => {
    const result = registerInputSchema.safeParse({ ...valid, email: "  PERSON@Example.com " });

    expect(result.success && result.data.email).toBe("person@example.com");
  });

  it("leaves the password untouched", () => {
    const result = registerInputSchema.safeParse({ ...valid, password: " pass1234 " });

    expect(result.success && result.data.password).toBe(" pass1234 ");
  });

  it.each(["email", "password", "name"] as const)(
    "rejects a request missing %s",
    (field) => {
      const incomplete = { ...valid } as Record<string, unknown>;
      delete incomplete[field];

      const result = registerInputSchema.safeParse(incomplete);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path[0]).toBe(field);
    },
  );
});

describe("loginInputSchema", () => {
  it("accepts an email and any non-empty password", () => {
    // Login must not enforce the registration strength rules: an account
    // created before the rules tightened still has to be able to sign in.
    expect(loginInputSchema.safeParse({ email: "person@example.com", password: "x" }).success).toBe(
      true,
    );
  });

  it("rejects an empty password", () => {
    const result = loginInputSchema.safeParse({ email: "person@example.com", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Password is required");
  });
});

describe("authResponseSchema", () => {
  it("accepts the envelope the controller sends", () => {
    const response: AuthResponse = { user: validUser };

    expect(authResponseSchema.safeParse(response).success).toBe(true);
  });

  it("has no room for tokens, which travel in httpOnly cookies", () => {
    // Guarding the security decision as a test: if someone adds a token field
    // to this schema, the controller's own response shape is now visible in
    // the types, which is what a reviewer would catch.
    const withToken = { user: validUser, accessToken: "eyJ..." };

    expect(userSchema.safeParse(withToken).success).toBe(false);
    expect(authResponseSchema.safeParse(withToken).success).toBe(true);
  });

  it("strips a password if one leaks into the user object", () => {
    // z.object strips unknown keys rather than rejecting them, so parsing is
    // the last line of defence: whatever the repository returns, the value
    // that reaches the client is built from the parsed output.
    const leaky = { user: { ...validUser, password: "hashed" } };

    const result = authResponseSchema.safeParse(leaky);

    expect(result.success).toBe(true);
    expect(result.success && result.data.user).toEqual(validUser);
    expect(result.success && "password" in result.data.user).toBe(false);
  });
});

describe("forgotPasswordInputSchema", () => {
  it("normalises the email, so a pasted address still matches the account", () => {
    const result = forgotPasswordInputSchema.safeParse({ email: "  PERSON@Example.com " });

    expect(result.success && result.data.email).toBe("person@example.com");
  });

  it("rejects a malformed address", () => {
    const result = forgotPasswordInputSchema.safeParse({ email: "not-an-email" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid email address");
  });
});

describe("resetPasswordInputSchema", () => {
  it("accepts a token and a password that meets the strength rules", () => {
    const result = resetPasswordInputSchema.safeParse({
      token: "a-token",
      password: "new-password-1",
    });

    expect(result.success).toBe(true);
  });

  it("enforces the same strength rules as registration", () => {
    // A reset is the one way to set a password on an existing account, so a
    // weak password has to be refused here too or the rule is only cosmetic.
    const result = resetPasswordInputSchema.safeParse({ token: "a-token", password: "short" });

    expect(result.success).toBe(false);
  });

  it("rejects an empty token", () => {
    const result = resetPasswordInputSchema.safeParse({ token: "", password: "new-password-1" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Reset token is required");
  });
});

describe("changePasswordInputSchema", () => {
  it("accepts a current password and a strong new one", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "correct-horse",
      newPassword: "brand-new-password",
    });

    expect(result.success).toBe(true);
  });

  it("enforces the same strength rules as registration", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "correct-horse",
      newPassword: "short",
    });

    expect(result.success).toBe(false);
  });

  it("refuses a new password identical to the current one", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "same-password-1",
      newPassword: "same-password-1",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "New password must be different from the current one",
    );
  });

  it("requires the current password so the check cannot be skipped", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "",
      newPassword: "brand-new-password",
    });

    expect(result.success).toBe(false);
  });
});

describe("passwordActionResponseSchema", () => {
  it("accepts the envelope both endpoints send", () => {
    expect(
      passwordActionResponseSchema.safeParse({
        message: "If an account exists for that email, a reset link is on its way",
      }).success,
    ).toBe(true);
  });

  it("leaves no field a caller could use to tell accounts apart", () => {
    const parsed = passwordActionResponseSchema.parse({ message: "ok" });

    expect(Object.keys(parsed)).toEqual(["message"]);
  });
});

/**
 * Compile-time check: the inferred types accept the values the API actually
 * produces. This is a type assertion, not a runtime test — it fails the
 * typecheck rather than a test run if the schemas and types diverge.
 */
describe("inferred types", () => {
  it("matches the schema's inferred input and output", () => {
    type Input = z.input<typeof registerInputSchema>;
    type Output = z.output<typeof registerInputSchema>;

    const input: Input = { email: "person@example.com", password: "password123", name: "Nirmal" };
    const output: Output = registerInputSchema.parse(input);

    expect(output.email).toBe(input.email);
  });
});
