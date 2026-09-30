import axios, { AxiosError } from "axios";
import { apiErrorSchema, validationErrorSchema } from "@job-kanban/shared";

/**
 * The API hands out httpOnly cookies, so every request must carry credentials
 * and the API must allow this origin (CORS_ORIGINS in apps/api/.env).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

export type FieldErrors = Record<string, string>;

/**
 * Carries a message plus per-field messages so a form can show both. The API
 * answers a schema mismatch with
 * { message, code: "VALIDATION_ERROR", issues: [{ field, message }] } and
 * anything else with { message, code }.
 */
export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** True when the failure belongs to specific inputs rather than the form. */
  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError("Something went wrong", 0);
  }

  const axiosError = error as AxiosError<unknown>;
  const status = axiosError.response?.status ?? 0;
  const data = axiosError.response?.data;

  const validation = validationErrorSchema.safeParse(data);
  if (validation.success) {
    return new ApiError(
      validation.data.message,
      status,
      Object.fromEntries(
        validation.data.issues.map((issue) => [issue.field, issue.message]),
      ),
    );
  }

  const apiError = apiErrorSchema.safeParse(data);
  if (apiError.success) {
    return new ApiError(apiError.data.message, status);
  }

  if (axiosError.code === "ERR_NETWORK") {
    return new ApiError("Could not reach the server", status);
  }

  return new ApiError("Something went wrong", status);
}
