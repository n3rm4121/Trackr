import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { eq, sql } from "drizzle-orm";

import { db, pool } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";

/**
 * This suite talks to a real Postgres, because "is the database connected" is
 * not a question a mocked client can answer.
 *
 * It reads DATABASE_URL from .env.test. The round-trip test writes and deletes
 * a row, so the suite refuses to run unless that URL names a database that
 * looks like a test database — a mis-set .env.test should fail loudly here
 * rather than quietly mutate a developer's real data.
 */

const QUERY_BUDGET_MS = 5_000;

const testDatabaseName = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? "").pathname.replace(/^\//, "");
  } catch {
    return "";
  }
})();

const testUser = {
  email: "db-connectivity@example.test",
  name: "DB Connectivity Probe",
  password: "not-a-real-hash",
};

afterAll(async () => {
  await pool.end();
});

describe("database connection", () => {
  beforeAll(() => {
    expect(
      process.env.DATABASE_URL,
      "DATABASE_URL is not set. src/tests/setup.ts should have loaded .env.test.",
    ).toBeTruthy();

    expect(
      testDatabaseName,
      `Refusing to run against "${testDatabaseName || process.env.DATABASE_URL}" — the test database name must end in "_test".`,
    ).toMatch(/_test$/);
  });

  it("runs a trivial query through the pool", async () => {
    const result = await db.execute<{ answer: number }>(sql`select 1 as answer`);

    expect(result.rows).toEqual([{ answer: 1 }]);
  });

  it("connects to the database named in DATABASE_URL", async () => {
    const result = await db.execute<{ database: string }>(
      sql`select current_database() as database`,
    );

    expect(result.rows[0]?.database).toBe(testDatabaseName);
  });

  it("surfaces a connection failure instead of swallowing it", async () => {
    // Guards the premise of every other test: a green suite here means the
    // connection genuinely works, not that errors are being hidden.
    const offlinePool = new Pool({
      connectionString: "postgresql://postgres:@127.0.0.1:1/does-not-exist",
      connectionTimeoutMillis: 1_000,
    });

    try {
      // pg rejects with an AggregateError whose message is empty, so the
      // failure is identified by its code rather than its text.
      await expect(offlinePool.query("select 1")).rejects.toMatchObject({
        code: "ECONNREFUSED",
      });
    } finally {
      await offlinePool.end();
    }
  });

  it("has the schema migrations applied", async () => {
    const result = await db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables
          where table_schema = 'public' and table_name in ('users', 'applications')
          order by table_name`,
    );

    expect(result.rows.map((row) => row.table_name)).toEqual([
      "applications",
      "users",
    ]);
  });

  it("round-trips a row through the ORM", async () => {
    const [created] = await db
      .insert(usersTable)
      .values(testUser)
      .returning();

    try {
      expect(created).toBeDefined();
      expect(created.email).toBe(testUser.email);

      const [found] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, testUser.email));

      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(testUser.name);
    } finally {
      await db.delete(usersTable).where(eq(usersTable.email, testUser.email));
    }
  });

  it("answers queries within the latency budget", async () => {
    const startedAt = performance.now();

    await db.execute(sql`select 1`);

    expect(performance.now() - startedAt).toBeLessThan(QUERY_BUDGET_MS);
  });
});
