import { z } from "zod";

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

export const validationErrorSchema = apiErrorSchema.extend({
  code: z.literal("VALIDATION_ERROR").optional(),
  issues: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    }),
  ),
});

export const healthResponseSchema = z.object({
  status: z.literal("OK"),
  message: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ValidationIssue = ValidationError["issues"][number];
