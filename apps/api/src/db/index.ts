import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import config from "../config/config.js";

// config (and with it dotenv) rather than process.env directly: this module is
// evaluated before the app's other imports, so reading the raw env var here
// would capture an undefined value and hand the pool a default connection.
export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export const db = drizzle({ client: pool });
