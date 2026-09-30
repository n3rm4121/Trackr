/**
 * The job-application model behind the board.
 *
 * This is the only module that knows what an application is. The board, the
 * detail drawer, the mobile sheet and the stats page all read from here, so a
 * field is added in one place rather than four.
 *
 * The shape and the field rules come from @job-kanban/shared, which is the same
 * declaration the API validates against — a field renamed there fails the
 * shared schema tests rather than this board quietly going stale.
 *
 * The one deliberate difference is the id: the API numbers applications, while
 * the board keys everything by string because that is what dnd-kit's `move`
 * helper works with. `lib/applications-api.ts` owns that conversion.
 */

import {
  APPLICATION_STATUSES,
  type Application as ApiApplication,
  type ApplicationStatus,
  type Note as ApiNote,
} from "@job-kanban/shared";

export const STATUSES = APPLICATION_STATUSES;

export type Status = ApplicationStatus;

export type StatusMeta = {
  id: Status;
  title: string;
  dot: string;
  accent: string;
};

export const STATUS_META: Record<Status, StatusMeta> = {
  applied: {
    id: "applied",
    title: "Applied",
    dot: "bg-sky-500",
    accent: "text-sky-600 dark:text-sky-400",
  },
  interview: {
    id: "interview",
    title: "Interview Scheduled",
    dot: "bg-amber-500",
    accent: "text-amber-600 dark:text-amber-400",
  },
  offer: {
    id: "offer",
    title: "Offer",
    dot: "bg-emerald-500",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    id: "rejected",
    title: "Rejected",
    dot: "bg-rose-500",
    accent: "text-rose-600 dark:text-rose-400",
  },
};

export type Note = {
  id: string;
  body: string;
  createdAt: string;
  pending?: boolean;
};

export type Application = {
  id: string;
  company: string;
  role: string;
  jobUrl: string;
  location: string;
  salary: string;
  status: Status;
  appliedAt: string;
  /// Last time this application moved or was written on. Drives the "no response" badge, so it is updated on note writes too.
  lastActivityAt: string;
  notes: Note[];
};

/** The number the API calls this card, recovered from a board id. */
export function toApiId(id: string): number {
  return Number(id);
}

export function fromApiApplication(application: ApiApplication): Application {
  return {
    ...application,
    id: String(application.id),
    notes: application.notes.map((note) => fromApiNote(note)),
  };
}

export function fromApiNote(note: ApiNote): Note {
  return { id: String(note.id), body: note.body, createdAt: note.createdAt };
}

export type BoardState = {
  // Status to the ordered ids of its cards. Kept as ids rather than objects  because dnd-kit's `move` helper works on id lists.
  columns: Record<Status, string[]>;
  applications: Record<string, Application>;
};

export function emptyBoard(): BoardState {
  return {
    columns: { applied: [], interview: [], offer: [], rejected: [] },
    applications: {},
  };
}

export function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  );
}
