import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const userNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const userSchema = z.object({
  id: z.number().int(),
  email: emailSchema,
  name: userNameSchema,
});

export type Email = z.infer<typeof emailSchema>;
export type UserName = z.infer<typeof userNameSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type User = z.infer<typeof userSchema>;
