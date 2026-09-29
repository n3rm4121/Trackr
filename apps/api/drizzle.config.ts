import { defineConfig } from "drizzle-kit";

// pnpm db:migrate:local   -> .env
// pnpm db:migrate:remote  -> .env.production

import "dotenv/config";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env (local) or .env.production (remote).",
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
