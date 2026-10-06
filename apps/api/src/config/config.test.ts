import { describe, it, expect } from "vitest";

import config from "./config.js";

/**
 * .env.test sets NODE_ENV=development and no SEED_NEW_USERS, so the default
 * path is what runs here: seeding on outside production.
 */
describe("config", () => {
  it("seeds new accounts by default outside production", () => {
    expect(config.seedNewUsers).toBe(true);
  });
});
