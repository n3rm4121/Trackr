import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Exported so tests can release the sockets; a live pool otherwise keeps the
// Vitest process alive after the suite finishes.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool });
