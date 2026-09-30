/**
 * Error carrying an HTTP status so the controller can map failures to
 * responses without a class hierarchy. The global errorHandler reads it.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badCredentials = () =>
  new HttpError(401, "Invalid credentials", "INVALID_CREDENTIALS");

export const emailAlreadyRegistered = () =>
  new HttpError(409, "Email already registered", "EMAIL_ALREADY_REGISTERED");

export const invalidRefreshToken = () =>
  new HttpError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
