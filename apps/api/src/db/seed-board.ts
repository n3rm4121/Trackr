import type { ApplicationStatus } from "@trackr/shared";

import { db } from "./index.js";
import { applicationsTable, notesTable } from "./schema.js";
import { SAMPLE_APPLICATIONS } from "./sample-applications.js";

const DAY_MS = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

/**
 * Inserts the 10-card sample board (5 applied, 3 interview, 2 offer,
 * rejected empty) for one user.
 *
 * Positions are 0-based and contiguous within each column, in the order the
 * cards appear in SAMPLE_APPLICATIONS, so service.list returns them in board
 * order. Notes keep their relative ages so the timeline reads newest first.
 */
export async function seedSampleBoard(userId: number = 13): Promise<void> {
  const nextPosition = {} as Record<ApplicationStatus, number>;

  for (const sample of SAMPLE_APPLICATIONS) {
    const position = nextPosition[sample.status] ?? 0;
    nextPosition[sample.status] = position + 1;

    const [row] = await db
      .insert(applicationsTable)
      .values({
        userId,
        company: sample.company,
        role: sample.role,
        jobUrl: sample.jobUrl,
        location: sample.location,
        salary: sample.salary,
        status: sample.status,
        position,
        appliedAt: daysAgo(sample.appliedDaysAgo),
        lastActivityAt: daysAgo(
          sample.activityDaysAgo ?? sample.appliedDaysAgo,
        ),
      })
      .returning({ id: applicationsTable.id });

    if (!row) {
      throw new Error("failed to seed sample board");
    }

    for (const note of sample.notes ?? []) {
      await db.insert(notesTable).values({
        applicationId: row.id,
        body: note.body,
        createdAt: daysAgo(note.daysAgo),
      });
    }
  }
}
