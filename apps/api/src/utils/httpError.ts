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

export const invalidResetToken = () =>
  new HttpError(
    400,
    "This reset link is invalid or has expired",
    "INVALID_RESET_TOKEN",
  );

/**
 * A card that is missing and a card that belongs to somebody else get the same
 * answer, so a caller cannot learn whether an id exists by watching for a 403.
 */
export const applicationNotFound = () =>
  new HttpError(404, "Application not found", "APPLICATION_NOT_FOUND");

export const noteNotFound = () =>
  new HttpError(404, "Note not found", "NOTE_NOT_FOUND");

/**
 * A drop that does not describe a coherent board. Deliberately vague: the
 * client sent an order that cannot be applied, and saying which id was wrong
 * would only help someone probing for other people's cards.
 */
export const invalidBoardOrder = () =>
  new HttpError(
    400,
    "That board order does not match your applications",
    "INVALID_BOARD_ORDER",
  );
