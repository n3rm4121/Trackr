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

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
