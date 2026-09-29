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

// Returns the raw refresh token (sent to the client once) and its
// SHA-256 hash (stored in the database). Never store the raw value.

export function generateRefreshToken(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashRefreshToken(raw),
    expiresAt: new Date(Date.now() + config.refreshTokenTtlMs),
  };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
