import type { ApplicationStatus } from "@trackr/shared";

import type {
  ApplicationPatch,
  ApplicationRepository,
  ApplicationWithNotes,
} from "../../application.repository.js";

type StoredApplication = ApplicationWithNotes & { userId: number };

/**
 * In-memory stand-in for ApplicationRepository.
 *
 * Every row records the user that owns it and every read filters on that, so a
 * test can prove the service never reaches across the line.
 *
 * Deliberately does not implement position arithmetic: that is the
 * repository's job and it is tested against a real database in the integration
 * suite. A fake that reimplemented the rules would be a second, less honest
 * copy of them.
 */
export class FakeApplicationRepository {
  private rows: StoredApplication[] = [];
  private nextId = 1;
  private nextNoteId = 1;

  /** The last order passed to applyOrder, so a test can assert a drop was sent. */
  lastAppliedOrder: Record<ApplicationStatus, number[]> | null = null;
  /** The subset the service decided had actually changed column. */
  lastMoved: number[] = [];

  reset() {
    this.rows = [];
    this.nextId = 1;
    this.nextNoteId = 1;
    this.lastAppliedOrder = null;
    this.lastMoved = [];
  }

  /** Puts a card on the board directly, bypassing create. */
  given(
    userId: number,
    row: Partial<ApplicationWithNotes> & { status: ApplicationStatus },
  ): StoredApplication {
    const application: StoredApplication = {
      userId,
      id: row.id ?? this.nextId++,
      company: row.company ?? "Company",
      role: row.role ?? "Role",
      jobUrl: row.jobUrl ?? "",
      location: row.location ?? "",
      salary: row.salary ?? "",
      jobDescription: row.jobDescription ?? "",
      cvFileName: row.cvFileName ?? "",
      cvMime: row.cvMime ?? "",
      cvSize: row.cvSize ?? 0,
      status: row.status,
      appliedAt: row.appliedAt ?? new Date("2026-01-01T00:00:00.000Z"),
      lastActivityAt:
        row.lastActivityAt ?? new Date("2026-01-01T00:00:00.000Z"),
      notes: row.notes ?? [],
    };
    this.rows.push(application);
    return application;
  }

  /** Every card this fake holds, for assertions. */
  all() {
    return [...this.rows];
  }

  async listByUser(userId: number) {
    return this.owned(userId);
  }

  async findById(userId: number, id: number) {
    return this.owned(userId).find((row) => row.id === id);
  }

  async create(
    userId: number,
    input: {
      company: string;
      role: string;
      jobUrl: string;
      location: string;
      salary: string;
      jobDescription: string;
      status: ApplicationStatus;
      appliedAt: Date;
    },
  ) {
    return this.given(userId, {
      company: input.company,
      role: input.role,
      jobUrl: input.jobUrl,
      location: input.location,
      salary: input.salary,
      jobDescription: input.jobDescription,
      status: input.status,
      appliedAt: input.appliedAt,
      // Mirrors the repository: a new card is activity on itself.
      lastActivityAt: new Date(),
      notes: [],
    });
  }

  async update(userId: number, id: number, patch: ApplicationPatch) {
    const row = await this.findById(userId, id);
    if (!row) {
      return undefined;
    }
    Object.assign(row, patch, { lastActivityAt: new Date() });
    return row;
  }

  async remove(userId: number, id: number) {
    const owned = this.owned(userId);
    const match = owned.find((row) => row.id === id);
    if (!match) {
      return false;
    }
    this.rows.splice(this.rows.indexOf(match), 1);
    return true;
  }

  async applyOrder(
    userId: number,
    columns: Record<ApplicationStatus, number[]>,
    moved: number[] = [],
  ) {
    this.lastAppliedOrder = columns;
    this.lastMoved = moved;
    for (const [status, ids] of Object.entries(columns)) {
      for (const id of ids) {
        const row = this.owned(userId).find((candidate) => candidate.id === id);
        if (row) {
          row.status = status as ApplicationStatus;
          // Mirrors the real repository: only the cards that changed column
          // have their silence clock advanced.
          if (moved.includes(id)) {
            row.lastActivityAt = new Date();
          }
        }
      }
    }
  }

  async addNote(userId: number, applicationId: number, body: string) {
    const row = await this.findById(userId, applicationId);
    if (!row) {
      return undefined;
    }
    const note = { id: this.nextNoteId++, body, createdAt: new Date() };
    row.notes.unshift(note);
    row.lastActivityAt = note.createdAt;
    return note;
  }

  async removeNote(userId: number, applicationId: number, noteId: number) {
    const row = await this.findById(userId, applicationId);
    if (!row) {
      return false;
    }
    const before = row.notes.length;
    row.notes = row.notes.filter((note) => note.id !== noteId);
    return row.notes.length !== before;
  }

  async saveCv(
    userId: number,
    applicationId: number,
    file: { originalName: string; mime: string; size: number; dataBase64: string },
  ) {
    const row = await this.findById(userId, applicationId);
    if (!row) {
      return undefined;
    }
    row.cvFileName = file.originalName;
    row.cvMime = file.mime;
    row.cvSize = file.size;
    return row;
  }

  async getCv(userId: number, applicationId: number) {
    const row = await this.findById(userId, applicationId);
    if (!row || !row.cvFileName) {
      return undefined;
    }
    return {
      fileName: row.cvFileName,
      mime: row.cvMime,
      size: row.cvSize,
      dataBase64: "ZHVtbXk=",
    };
  }

  async removeCv(userId: number, applicationId: number) {
    const row = await this.findById(userId, applicationId);
    if (!row) {
      return undefined;
    }
    row.cvFileName = "";
    row.cvMime = "";
    row.cvSize = 0;
    return row;
  }

  private columnLabels: Partial<Record<ApplicationStatus, string>> = {};

  async getColumnLabels() {
    return { ...this.columnLabels };
  }

  async setColumnLabels(
    _userId: number,
    labels: Record<ApplicationStatus, string>,
  ) {
    this.columnLabels = { ...labels };
  }

  private owned(userId: number): StoredApplication[] {
    return this.rows.filter((row) => row.userId === userId);
  }
}

/**
 * The service is written against the concrete repository class, so the fake is
 * handed over through a cast. It has to implement the same surface; anything
 * the service starts calling that the fake lacks fails to compile here.
 */
export function asRepository(
  fake: FakeApplicationRepository,
): ApplicationRepository {
  return fake as unknown as ApplicationRepository;
}
