import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiErrorSchema, validationErrorSchema } from "@trackr/shared";
import { config } from "./config";

/**
 * The API hands out httpOnly cookies, so every request must carry credentials
 * and the API must allow this origin (CORS_ORIGINS in apps/api/.env).
 */
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: unknown = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/me"
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh");
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

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
