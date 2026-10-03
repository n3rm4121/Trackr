import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Tests read .env.test rather than .env so a developer's local database
 * credentials never leak into a test run, and so a test failure always has
 * known configuration.
 *
 * The path is resolved from this file rather than process.cwd(), because
 * Vitest sets cwd to the workspace root when a project is run from the root
 * (pnpm test) but to the package when run there (pnpm test:api).
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, "../../.env.test");

dotenv.config({ path: envPath });
