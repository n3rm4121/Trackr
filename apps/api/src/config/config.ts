import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

type TokenExpiry = NonNullable<SignOptions["expiresIn"]>;

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  accessTokenExpiry: TokenExpiry;
  refreshTokenTtlMs: number;
  isProduction: boolean;
  corsOrigins: string[];
  cookieSecure: boolean;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

const jwtSecret = process.env.JWT_SECRET;
const databaseUrl = process.env.DATABASE_URL;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;

const refreshTokenTtlMs = process.env.REFRESH_TOKEN_TTL_MS
  ? Number(process.env.REFRESH_TOKEN_TTL_MS)
  : undefined;

if (!jwtSecret) {
  throw new Error("JWT_SECRET must be set");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set");
}

if (!accessTokenExpiry) {
  throw new Error("ACCESS_TOKEN_EXPIRY must be set");
}

function parseTokenExpiry(value: string): TokenExpiry {
  if (!/^\d+[smhd]$/.test(value)) {
    throw new Error(
      `ACCESS_TOKEN_EXPIRY must look like "15m", "24h", or "7d" (got "${value}")`,
    );
  }
  return value as TokenExpiry;
}

if (refreshTokenTtlMs === undefined || Number.isNaN(refreshTokenTtlMs)) {
  throw new Error("REFRESH_TOKEN_TTL_MS must be a valid number");
}

const isProduction = nodeEnv === "production";

const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv,
  databaseUrl,
  jwtSecret,
  accessTokenExpiry: parseTokenExpiry(accessTokenExpiry),
  refreshTokenTtlMs,
  isProduction,
  corsOrigins,
  cookieSecure: isProduction,
};

export default config;
