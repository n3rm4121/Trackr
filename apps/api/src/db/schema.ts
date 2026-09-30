import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { APPLICATION_STATUSES, type ApplicationStatus } from "@job-kanban/shared";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
});

export const sessionsTable = pgTable(
  "sessions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // SHA-256 hash of the refresh token. The raw token is never stored.
    tokenHash: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("sessions_token_hash_idx").on(table.tokenHash)],
);

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  // SHA-256 hash of the reset token. The raw token only ever exists in the
  // emailed link, so a leaked database cannot be used to reset anyone's
  // password.
  tokenHash: text().notNull().unique(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

/**
 * One card on the board. Every query is scoped by userId, so one person's
 * applications are unreachable from another's session.
 *
 * `position` is stored rather than derived from createdAt: the board is
 * drag-and-drop, and "sort by date" cannot express "second from the top of the
 * Interview column". Values are 0-based and contiguous per column, rewritten as
 * a whole by the reorder endpoint.
 */
export const applicationsTable = pgTable(
  "applications",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    company: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 255 }).notNull(),
    jobUrl: text().notNull().default(""),
    location: varchar({ length: 255 }).notNull().default(""),
    salary: varchar({ length: 255 }).notNull().default(""),
    status: varchar({ length: 32 })
      .$type<ApplicationStatus>()
      .notNull()
      .default("applied"),
    position: integer().notNull().default(0),
    appliedAt: timestamp({ withTimezone: true }).notNull(),
    /** Bumped on any move or note, and it is what the "no response" badge
   *  reads, so it is deliberately not the same as updatedAt. */
    lastActivityAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // The board query is "this user's cards in board order", so the sort keys
    // lead with the filter.
    index("applications_user_status_position_idx").on(
      table.userId,
      table.status,
      table.position,
    ),
    index("applications_user_id_idx").on(table.userId),
    // Defence in depth: the status is validated by the request schema, and the
    // database refuses anything else even if a future code path forgets.
    check(
      "applications_status_check",
      sql`${table.status} in (${sql.join(
        APPLICATION_STATUSES.map((status) => sql`${status}`),
        sql`, `,
      )})`,
    ),
  ],
);

export const notesTable = pgTable(
  "notes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    applicationId: integer()
      .notNull()
      .references(() => applicationsTable.id, { onDelete: "cascade" }),
    body: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // A card's timeline is read newest first.
    index("notes_application_created_idx").on(
      table.applicationId,
      table.createdAt.desc(),
    ),
  ],
);

