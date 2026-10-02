import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { APPLICATION_STATUSES, type ApplicationStatus } from "@trackr/shared";
import { applicationsTable, notesTable } from "../../db/schema.js";
import { db } from "../../db/index.js";

type ApplicationRow = typeof applicationsTable.$inferSelect;
type NoteRow = typeof notesTable.$inferSelect;

// The transaction handle Drizzle passes to a callback.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ApplicationWithNotes = {
  id: number;
  company: string;
  role: string;
  jobUrl: string;
  location: string;
  salary: string;
  status: ApplicationStatus;
  appliedAt: Date;
  lastActivityAt: Date;
  notes: { id: number; body: string; createdAt: Date }[];
};

/**
 * A partial edit. Every field is explicitly `| undefined` because this package
 * compiles with exactOptionalPropertyTypes, where `field?: string` and
 * `field: undefined` are different things — and the service hands over a patch
 * built by spreading an optional body.
 */
export type ApplicationPatch = {
  company?: string | undefined;
  role?: string | undefined;
  jobUrl?: string | undefined;
  location?: string | undefined;
  salary?: string | undefined;
  status?: ApplicationStatus | undefined;
  appliedAt?: Date | undefined;
};

/**
 * The board renders its columns left to right in a fixed order, which is not
 * the order Postgres would return rows in, so the column order has to be
 * expressed in the query.
 *
 * The statuses are inlined rather than bound. They are a compile-time constant
 * from the shared enum, not anything a caller supplied, and a fragment with
 * placeholders inside orderBy misaligns Drizzle's bind parameters.
 */
const STATUS_ORDER_SQL = sql.raw(
  `array_position(ARRAY[${APPLICATION_STATUSES.map(
    (status) => `'${status}'`,
  ).join(",")}]::varchar[], "status")`,
);

/**
 * Ordering note: `position` is 0-based and contiguous inside a single column.
 * Nothing outside this file is allowed to invent a position — "after this
 * card" and "at the end" are both resolved here, so the invariant is written
 * down once.
 */
export class ApplicationRepository {
  /** The whole board in render order, notes newest first. */
  async listByUser(userId: number): Promise<ApplicationWithNotes[]> {
    const rows = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, userId))
      .orderBy(
        // Column in board order first, then position within the column.
        STATUS_ORDER_SQL,
        asc(applicationsTable.position),
        asc(applicationsTable.id),
      );

    return this.attachNotes(rows);
  }

  async findById(
    userId: number,
    id: number,
  ): Promise<ApplicationWithNotes | undefined> {
    // The userId is part of the WHERE clause, not a check afterwards: a
    // stranger's card has to be indistinguishable from a card that does not
    // exist.
    const [row] = await db
      .select()
      .from(applicationsTable)
      .where(
        and(eq(applicationsTable.id, id), eq(applicationsTable.userId, userId)),
      );

    if (!row) {
      return undefined;
    }

    const [withNotes] = await this.attachNotes([row]);
    return withNotes;
  }

  async create(
    userId: number,
    input: {
      company: string;
      role: string;
      jobUrl: string;
      location: string;
      salary: string;
      status: ApplicationStatus;
      appliedAt: Date;
    },
  ): Promise<ApplicationWithNotes> {
    const position = await this.nextPosition(userId, input.status);
    const now = new Date();

    const [row] = await db
      .insert(applicationsTable)
      .values({
        userId,
        company: input.company,
        role: input.role,
        jobUrl: input.jobUrl,
        location: input.location,
        salary: input.salary,
        status: input.status,
        position,
        appliedAt: input.appliedAt,
        // A new card is activity on itself, so it never opens with a
        // "no response" badge.
        lastActivityAt: now,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create application");
    }

    const [withNotes] = await this.attachNotes([row]);
    if (!withNotes) {
      throw new Error("Failed to create application");
    }
    return withNotes;
  }

  /**
   * Writes a patch, and moves the card if the patch changes its status.
   *
   * A rename-and-move is one transaction rather than two statements: the card
   * can never end up renamed but still in the old column, and the column it
   * leaves never keeps a hole where it used to be.
   */
  async update(
    userId: number,
    id: number,
    patch: ApplicationPatch,
  ): Promise<ApplicationWithNotes | undefined> {
    const changedStatus = await db.transaction(async (tx) => {
      // Read first: the gap to close in the old column is described by where
      // the card is now, which the update would otherwise overwrite.
      const [current] = await tx
        .select({
          id: applicationsTable.id,
          status: applicationsTable.status,
          position: applicationsTable.position,
        })
        .from(applicationsTable)
        .where(
          and(
            eq(applicationsTable.id, id),
            eq(applicationsTable.userId, userId),
          ),
        );

      if (!current) {
        return null;
      }

      const movingColumns =
        patch.status !== undefined && patch.status !== current.status;

      if (movingColumns) {
        // Everyone below it in the column it is leaving moves up one, so
        // positions stay contiguous and a later drop lands where it looks.
        await tx
          .update(applicationsTable)
          .set({ position: sql`${applicationsTable.position} - 1` })
          .where(
            and(
              eq(applicationsTable.userId, userId),
              eq(applicationsTable.status, current.status),
              sql`${applicationsTable.position} > ${current.position}`,
            ),
          );
      }

      const [updated] = await tx
        .update(applicationsTable)
        .set({
          company: patch.company,
          role: patch.role,
          jobUrl: patch.jobUrl,
          location: patch.location,
          salary: patch.salary,
          appliedAt: patch.appliedAt,
          ...(patch.status === undefined ? {} : { status: patch.status }),
          ...(movingColumns
            ? {
                position: await this.positionAtEnd(
                  tx,
                  userId,
                  patch.status!,
                  id,
                ),
              }
            : {}),
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(applicationsTable.id, id),
            eq(applicationsTable.userId, userId),
          ),
        )
        .returning({ id: applicationsTable.id });

      return updated ? updated.id : null;
    });

    if (changedStatus === null) {
      return undefined;
    }

    const row = await this.findById(userId, id);
    return row;
  }

  async remove(userId: number, id: number): Promise<boolean> {
    const rows = await db
      .delete(applicationsTable)
      .where(
        and(eq(applicationsTable.id, id), eq(applicationsTable.userId, userId)),
      )
      .returning({ id: applicationsTable.id });

    return rows.length > 0;
  }
  /**
   * Rewrites every card's column and position from the ordered columns the
   * client sent. The column a card is listed under is what makes it that
   * status, so this writes both.
   *
   * One transaction on purpose. A drop is a multi-row write, and a partial one
   * would leave two cards sharing a position — which renders as a card that
   * jumps around on the next reload.
   *
   * `moved` is the subset that changed column. Only those have their
   * lastActivityAt advanced; the rest keep the silence clock that drives the
   * "no response" badge.
   */
  async applyOrder(
    userId: number,
    columns: Record<ApplicationStatus, number[]>,
    moved: number[] = [],
  ): Promise<void> {
    const writes: {
      id: number;
      status: ApplicationStatus;
      position: number;
    }[] = [];

    for (const status of APPLICATION_STATUSES) {
      columns[status].forEach((id, index) => {
        writes.push({ id, status, position: index });
      });
    }

    await db.transaction(async (tx) => {
      for (const write of writes) {
        const progressed = moved.includes(write.id);
        await tx
          .update(applicationsTable)
          .set({
            status: write.status,
            position: write.position,
            ...(progressed ? { lastActivityAt: new Date() } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(applicationsTable.id, write.id),
              eq(applicationsTable.userId, userId),
            ),
          );
      }
    });
  }

  async addNote(
    userId: number,
    applicationId: number,
    body: string,
  ): Promise<NoteRow | undefined> {
    const [note] = await db
      .insert(notesTable)
      .values({ applicationId, body })
      .returning();

    if (!note) {
      return undefined;
    }

    // A note is activity, so the card's "no response" clock restarts. Scoped
    // by userId so a note cannot be attached to somebody else's card.
    const updated = await db
      .update(applicationsTable)
      .set({ lastActivityAt: note.createdAt, updatedAt: new Date() })
      .where(
        and(
          eq(applicationsTable.id, applicationId),
          eq(applicationsTable.userId, userId),
        ),
      )
      .returning({ id: applicationsTable.id });

    if (updated.length === 0) {
      // The card is not this user's (or is gone): undo the note rather than
      // leave an orphan row behind.
      await db.delete(notesTable).where(eq(notesTable.id, note.id));
      return undefined;
    }

    return note;
  }

  async removeNote(
    userId: number,
    applicationId: number,
    noteId: number,
  ): Promise<boolean> {
    // Ownership is settled before the delete, not after. Deleting first and
    // checking afterwards would let anyone who knows a card id destroy another
    // user's notes — the check would report the damage it had just caused.
    const owned = await db
      .select({ id: applicationsTable.id })
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.id, applicationId),
          eq(applicationsTable.userId, userId),
        ),
      );

    if (owned.length === 0) {
      return false;
    }

    const rows = await db
      .delete(notesTable)
      .where(
        and(
          eq(notesTable.id, noteId),
          eq(notesTable.applicationId, applicationId),
        ),
      )
      .returning({ id: notesTable.id });

    return rows.length > 0;
  }

  private async nextPosition(
    userId: number,
    status: ApplicationStatus,
  ): Promise<number> {
    const [row] = await db
      .select({ max: sql<number | null>`max(${applicationsTable.position})` })
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.userId, userId),
          eq(applicationsTable.status, status),
        ),
      );

    return row?.max === null || row?.max === undefined ? 0 : row.max + 1;
  }

  private async positionAtEnd(
    tx: Tx,
    userId: number,
    status: ApplicationStatus,
    excludeId: number,
  ): Promise<number> {
    const [row] = await tx
      .select({ max: sql<number | null>`max(${applicationsTable.position})` })
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.userId, userId),
          eq(applicationsTable.status, status),
          sql`${applicationsTable.id} <> ${excludeId}`,
        ),
      );

    return row?.max === null || row?.max === undefined ? 0 : row.max + 1;
  }

  /**
   * Loads the notes for a set of rows in one query and groups them in memory.
   * A per-application query would be N round trips for one board render.
   */
  private async attachNotes(
    rows: ApplicationRow[],
  ): Promise<ApplicationWithNotes[]> {
    if (rows.length === 0) {
      return [];
    }

    const notes = await db
      .select()
      .from(notesTable)
      .where(
        inArray(
          notesTable.applicationId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(desc(notesTable.createdAt), desc(notesTable.id));

    const byApplication = new Map<number, NoteRow[]>();
    for (const note of notes) {
      const bucket = byApplication.get(note.applicationId);
      if (bucket) {
        bucket.push(note);
      } else {
        byApplication.set(note.applicationId, [note]);
      }
    }

    return rows.map((row) => ({
      id: row.id,
      company: row.company,
      role: row.role,
      jobUrl: row.jobUrl,
      location: row.location,
      salary: row.salary,
      status: row.status,
      appliedAt: row.appliedAt,
      lastActivityAt: row.lastActivityAt,
      notes: byApplication.get(row.id) ?? [],
    }));
  }
}
