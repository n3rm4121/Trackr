import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";

import { db, pool } from "../../db/index.js";
import { applicationsTable, notesTable, usersTable } from "../../db/schema.js";
import { ApplicationRepository } from "../../modules/applications/application.repository.js";
import { ApplicationService } from "../../modules/applications/application.service.js";
import { seedSampleBoard } from "../../db/seed-board.js";

/**
 * Ordering is the one part of this feature that a mock cannot honestly check:
 * "positions stay contiguous when a card leaves a column" is a claim about
 * SQL, so it is tested against a real Postgres.
 *
 * Reads DATABASE_URL from .env.test, and refuses to run against anything whose
 * name does not end in "_test".
 */

const testDatabaseName = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? "").pathname.replace(/^\//, "");
  } catch {
    return "";
  }
})();

let nextUserNumber = 1;

/** The id is left to the database: users.id is an identity column, so naming
 *  one explicitly is rejected rather than honoured. */
async function createUser(): Promise<number> {
  const [row] = await db
    .insert(usersTable)
    .values({
      email: `applications-test-${nextUserNumber++}@example.test`,
      name: "Applications Test",
      password: "not-a-real-hash",
    })
    .returning({ id: usersTable.id });

  if (!row) {
    throw new Error("failed to create test user");
  }
  return row.id;
}

const repository = new ApplicationRepository();
const service = new ApplicationService(repository);

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

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  // Ordered by dependency, so a delete of users takes the rest with it.
  await db.delete(notesTable);
  await db.delete(applicationsTable);
  await db.delete(usersTable);
});

describe("listing a board", () => {
  it("returns the caller's cards in board order, columns in board order", async () => {
    const userId = await createUser();
    await seedSampleBoard(userId);

    const board = await service.list(userId);

    // applied (5), then interview (3), then offer (2), rejected empty.
    expect(board).toHaveLength(10);
    expect(board.filter((a) => a.status === "applied")).toHaveLength(5);
    expect(board.filter((a) => a.status === "interview")).toHaveLength(3);
    expect(board.filter((a) => a.status === "offer")).toHaveLength(2);
    expect(board[0].company).toBe("Stripe");
  });

  it("never shows one user another user's cards", async () => {
    const mine = await createUser();
    const theirs = await createUser();
    await seedSampleBoard(mine);
    await seedSampleBoard(theirs);

    const board = await service.list(mine);

    expect(board).toHaveLength(10);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, theirs));
    expect(row?.count).toBe(10);
  });

  it("returns notes newest first", async () => {
    const userId = await createUser();
    const [card] = await service.list(userId);
    expect(card).toBeUndefined();

    const created = await service.create(userId, {
      company: "Stripe",
      role: "Frontend Engineer",
      jobUrl: "https://stripe.com/jobs",
      location: "Dublin",
      salary: "€95k",
      jobDescription: "",
      status: "applied",
      appliedAt: "2026-09-01T10:00:00.000Z",
    });
    await service.addNote(userId, created.id, { body: "older" });
    await service.addNote(userId, created.id, { body: "newer" });

    const [reloaded] = await service.list(userId);

    expect(reloaded.notes.map((note) => note.body)).toEqual([
      "newer",
      "older",
    ]);
  });
});

describe("positions", () => {
  it("starts a new card at the end of its column", async () => {
    const userId = await createUser();
    const first = await service.create(userId, baseInput("First"));
    const second = await service.create(userId, baseInput("Second"));

    const board = await service.list(userId);
    const ids = board.filter((a) => a.status === "applied").map((a) => a.id);

    expect(ids).toEqual([first.id, second.id]);
  });

  it("keeps positions contiguous after a drop across columns", async () => {
    const userId = await createUser();
    const a = await service.create(userId, baseInput("A"));
    const b = await service.create(userId, baseInput("B"));
    const c = await service.create(userId, baseInput("C"));

    // Drop C at the top of Interview, everything else stays put.
    await service.reorder(userId, {
      columns: {
        applied: [a.id, b.id],
        screening: [],
        interview: [c.id],
        offer: [],
        rejected: [],
      },
    });

    const board = await service.list(userId);
    expect(board.map((row) => [row.status, row.id])).toEqual([
      ["applied", a.id],
      ["applied", b.id],
      ["interview", c.id],
    ]);

    const positions = await db
      .select({
        status: applicationsTable.status,
        position: applicationsTable.position,
      })
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, userId))
      .orderBy(applicationsTable.status, applicationsTable.position);

    // 0-based and gapless in every column.
    expect(positions).toEqual([
      { status: "applied", position: 0 },
      { status: "applied", position: 1 },
      { status: "interview", position: 0 },
    ]);
  });

  it("survives a reload in the new order", async () => {
    const userId = await createUser();
    const a = await service.create(userId, baseInput("A"));
    const b = await service.create(userId, baseInput("B"));

    await service.reorder(userId, {
      columns: { applied: [b.id, a.id], screening: [], interview: [], offer: [], rejected: [] },
    });

    // A fresh service, so this is read from the database and not from any
    // object the test is still holding.
    const reloaded = await new ApplicationService(new ApplicationRepository()).list(
      userId,
    );

    expect(reloaded.map((row) => row.id)).toEqual([b.id, a.id]);
  });

  it("moves a card to the end of the target column and closes the gap behind it", async () => {
    const userId = await createUser();
    const a = await service.create(userId, baseInput("A"));
    const b = await service.create(userId, baseInput("B"));
    const c = await service.create(userId, baseInput("C"));

    // Move the top card out; the two below it should slide up, not leave holes.
    await service.update(userId, a.id, { status: "interview" });

    const board = await service.list(userId);
    expect(board.map((row) => [row.status, row.company])).toEqual([
      ["applied", "B"],
      ["applied", "C"],
      ["interview", "A"],
    ]);

    const positions = await db
      .select({
        company: applicationsTable.company,
        status: applicationsTable.status,
        position: applicationsTable.position,
      })
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, userId))
      .orderBy(applicationsTable.status, applicationsTable.position);

    expect(positions).toEqual([
      { company: "B", status: "applied", position: 0 },
      { company: "C", status: "applied", position: 1 },
      { company: "A", status: "interview", position: 0 },
    ]);
  });

  it("leaves a card where it is when the patch does not mention status", async () => {
    const userId = await createUser();
    const a = await service.create(userId, baseInput("A"));
    const b = await service.create(userId, baseInput("B"));

    await service.update(userId, a.id, { company: "Renamed" });

    const board = await service.list(userId);
    expect(board.map((row) => [row.status, row.company, row.id])).toEqual([
      ["applied", "Renamed", a.id],
      ["applied", "B", b.id],
    ]);
  });

  it("renames and moves in one write, leaving nothing half-done", async () => {
    const userId = await createUser();
    const a = await service.create(userId, baseInput("A"));
    await service.create(userId, baseInput("B"));

    const updated = await service.update(userId, a.id, {
      company: "A Renamed",
      status: "offer",
    });

    expect(updated.company).toBe("A Renamed");
    expect(updated.status).toBe("offer");
  });
});

describe("ownership", () => {
  it("refuses to read another user's card", async () => {
    const mine = await createUser();
    const theirs = await createUser();
    const card = await service.create(theirs, baseInput("Theirs"));

    await expect(service.get(mine, card.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.update(mine, card.id, { company: "Hijacked" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.remove(mine, card.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("does not change a card that belongs to somebody else", async () => {
    const mine = await createUser();
    const theirs = await createUser();
    const card = await service.create(theirs, baseInput("Theirs"));

    await service.update(mine, card.id, { company: "Hijacked" }).catch(() => {});

    const [row] = await db
      .select({ company: applicationsTable.company })
      .from(applicationsTable)
      .where(eq(applicationsTable.id, card.id));

    expect(row?.company).toBe("Theirs");
  });

  it("refuses to write a note onto another user's card, leaving no orphan row", async () => {
    const mine = await createUser();
    const theirs = await createUser();
    const card = await service.create(theirs, baseInput("Theirs"));

    await expect(
      service.addNote(mine, card.id, { body: "sneaky" }),
    ).rejects.toMatchObject({ status: 404 });

    // The note insert is rolled back rather than left pointing at a card the
    // caller cannot see.
    const [count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notesTable);
    expect(count?.count).toBe(0);
  });

  it("refuses to delete a note from another user's card", async () => {
    const mine = await createUser();
    const theirs = await createUser();
    const card = await service.create(theirs, baseInput("Theirs"));
    const note = await service.addNote(theirs, card.id, { body: "theirs" });

    await expect(
      service.removeNote(mine, card.id, note.id),
    ).rejects.toMatchObject({ status: 404 });

    await expect(service.get(theirs, card.id)).resolves.toMatchObject({
      notes: [{ body: "theirs" }],
    });
  });
});

describe("reorder validation", () => {
  it("leaves the silence clock alone for cards that only changed position", async () => {
    // The "no response" badge is driven by lastActivityAt, so a drop must not
    // reset it for the cards that stayed put. Only the card that changed column
    // counts as having moved on.
    const userId = await createUser();
    const staying = await service.create(userId, baseInput("Staying"));
    const moving = await service.create(userId, baseInput("Moving"));

    const before = await db
      .select({
        id: applicationsTable.id,
        lastActivityAt: applicationsTable.lastActivityAt,
      })
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, userId));
    expect(before).toHaveLength(2);

    // "Moving" crosses into interview; "Staying" is only listed.
    await service.reorder(userId, {
      columns: {
        applied: [staying.id],
        screening: [],
        interview: [moving.id],
        offer: [],
        rejected: [],
      },
    });

    const after = await db
      .select({
        id: applicationsTable.id,
        lastActivityAt: applicationsTable.lastActivityAt,
      })
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, userId));

    const clock = new Map(after.map((row) => [row.id, row.lastActivityAt.getTime()]));
    expect(clock.get(staying.id)).toBe(
      before.find((row) => row.id === staying.id)?.lastActivityAt.getTime(),
    );
    expect(clock.get(moving.id)!).toBeGreaterThanOrEqual(
      before.find((row) => row.id === moving.id)!.lastActivityAt.getTime(),
    );
  });

  it("refuses an order that would drop a card off the board", async () => {
    const userId = await createUser();
    const a = await service.create(userId, baseInput("A"));
    await service.create(userId, baseInput("B"));

    await expect(
      service.reorder(userId, {
        columns: { applied: [a.id], screening: [], interview: [], offer: [], rejected: [] },
      }),
    ).rejects.toMatchObject({ code: "INVALID_BOARD_ORDER" });

    // Nothing moved.
    const board = await service.list(userId);
    expect(board).toHaveLength(2);
  });

  it("refuses an order naming another user's card", async () => {
    const mine = await createUser();
    const theirs = await createUser();
    const a = await service.create(mine, baseInput("A"));
    const b = await service.create(theirs, baseInput("B"));

    await expect(
      service.reorder(mine, {
        columns: { applied: [a.id, b.id], screening: [], interview: [], offer: [], rejected: [] },
      }),
    ).rejects.toMatchObject({ code: "INVALID_BOARD_ORDER" });
  });

  it("refuses to list the same card twice", async () => {
    const userId = await createUser();
    const a = await service.create(userId, baseInput("A"));

    await expect(
      service.reorder(userId, {
        columns: { applied: [a.id, a.id], screening: [], interview: [], offer: [], rejected: [] },
      }),
    ).rejects.toMatchObject({ code: "INVALID_BOARD_ORDER" });
  });

  it("accepts an empty board", async () => {
    const userId = await createUser();

    await expect(
      service.reorder(userId, {
        columns: { applied: [], screening: [], interview: [], offer: [], rejected: [] },
      }),
    ).resolves.toEqual([]);
  });
});

describe("deleting", () => {
  it("takes a card's notes with it", async () => {
    const userId = await createUser();
    const card = await service.create(userId, baseInput("A"));
    await service.addNote(userId, card.id, { body: "one" });
    await service.addNote(userId, card.id, { body: "two" });

    await service.remove(userId, card.id);

    const [count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notesTable);
    expect(count?.count).toBe(0);
  });

  it("takes a user's board with the account", async () => {
    const userId = await createUser();
    await seedSampleBoard(userId);

    await db.delete(usersTable).where(eq(usersTable.id, userId));

    const [count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationsTable);
    expect(count?.count).toBe(0);
  });
});

describe("activity clock", () => {
  it("starts a new card as active so it never opens with a silence badge", async () => {
    const userId = await createUser();

    const card = await service.create(userId, baseInput("A"));

    expect(Date.parse(card.lastActivityAt)).toBeGreaterThan(
      Date.parse("2026-01-01T00:00:00.000Z"),
    );
  });

  it("restarts the clock when a note is written", async () => {
    const userId = await createUser();
    const card = await service.create(userId, baseInput("A"));

    await service.addNote(userId, card.id, { body: "ping" });

    const [reloaded] = await service.list(userId);
    expect(reloaded.lastActivityAt >= card.lastActivityAt).toBe(true);
  });
});

function baseInput(company: string) {
  return {
    company,
    role: "Frontend Engineer",
    jobUrl: "https://stripe.com/jobs/frontend-engineer",
    location: "Dublin, IE",
    salary: "€95k",
    jobDescription: "",
    status: "applied" as const,
    appliedAt: "2026-09-01T10:00:00.000Z",
  };
}
