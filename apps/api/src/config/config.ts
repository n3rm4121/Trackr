import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

type TokenExpiry = NonNullable<SignOptions["expiresIn"]>;

interface SmtpConfig {
  host: string;
  port: number;
  user: string | undefined;
  password: string | undefined;
  from: string;
}

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  accessTokenExpiry: TokenExpiry;
  refreshTokenTtlMs: number;
  passwordResetTokenTtlMs: number;
  isProduction: boolean;
  corsOrigins: string[];
  cookieSecure: boolean;
  appUrl: string;
  smtp: SmtpConfig;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

const jwtSecret = process.env.JWT_SECRET;
const databaseUrl = process.env.DATABASE_URL;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;

const refreshTokenTtlMs = process.env.REFRESH_TOKEN_TTL_MS
  ? Number(process.env.REFRESH_TOKEN_TTL_MS)
  : undefined;

const passwordResetTokenTtlMs = process.env.PASSWORD_RESET_TOKEN_TTL_MS
  ? Number(process.env.PASSWORD_RESET_TOKEN_TTL_MS)
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

if (
  passwordResetTokenTtlMs === undefined ||
  Number.isNaN(passwordResetTokenTtlMs)
) {
  throw new Error("PASSWORD_RESET_TOKEN_TTL_MS must be a valid number");
}

const isProduction = nodeEnv === "production";

const appUrl = process.env.APP_URL ?? "http://localhost:5173";

const smtp: SmtpConfig = {
  host: process.env.SMTP_HOST ?? "",
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM ?? "Trackr <no-reply@trackr.local>",
};

// Outside production the mailer prints links instead of sending them, so SMTP
// is only worth demanding once sending is actually how the link gets out.
if (isProduction) {
  if (!smtp.host) {
    throw new Error("SMTP_HOST must be set in production");
  }
  if (!appUrl) {
    throw new Error("APP_URL must be set in production");
  }
}

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
  passwordResetTokenTtlMs,
  isProduction,
  corsOrigins,
  cookieSecure: isProduction,
  appUrl,
  smtp,
};

export default config;
