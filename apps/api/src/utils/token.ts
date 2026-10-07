import { createHash, randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../config/config.js";

type TokenExpiry = NonNullable<SignOptions["expiresIn"]>;

export interface AccessTokenPayload {
  userId: number;
}

export function generateAccessToken(
  userId: number,
  expiresIn: TokenExpiry = config.accessTokenExpiry,
): string {
  const payload: AccessTokenPayload = { userId };
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
}

export interface RefreshTokenPayload {
  userId: number;
  // Bumped on password change/reset, which silently retires every refresh
  // token issued before it. This is the only server state refresh depends on.
  tokenVersion: number;
  jti: string;
}

// A self-contained signed refresh token: verified by signature, never looked
// up in the database. Revocation happens through the version check in
// AuthService.refresh, not through stored rows.
export function signRefreshToken(
  userId: number,
  tokenVersion: number,
): string {
  const payload = {
    userId,
    tokenVersion,
    jti: randomBytes(16).toString("hex"),
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: Math.floor(config.refreshTokenTtlMs / 1000),
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwtSecret) as RefreshTokenPayload;
}

// Same shape as a refresh token: the raw value is emailed to the user once and
// only its SHA-256 hash is stored, so read access to the database is not enough
// to take over an account.

export function generatePasswordResetToken(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashPasswordResetToken(raw),
    expiresAt: new Date(Date.now() + config.passwordResetTokenTtlMs),
  };
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
