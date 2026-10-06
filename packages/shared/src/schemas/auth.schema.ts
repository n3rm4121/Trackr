import { z } from "zod";

import {
  emailSchema,
  passwordSchema,
  userNameSchema,
  userSchema,
} from "./user.schema.js";

export const registerInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: userNameSchema,
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const authResponseSchema = z.object({
  user: userSchema,
});

export const forgotPasswordInputSchema = z.object({
  email: emailSchema,
});

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

// Both endpoints answer with a message and no user data, so nothing about
// whether an email has an account leaks back to the caller.
export const passwordActionResponseSchema = z.object({
  message: z.string(),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type PasswordActionResponse = z.infer<typeof passwordActionResponseSchema>;
