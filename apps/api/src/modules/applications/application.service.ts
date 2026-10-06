import {
  APPLICATION_STATUSES,
  STATUS_DEFAULT_TITLES,
  type AddNoteInput,
  type Application,
  type ApplicationStatus,
  type ColumnLabels,
  type CreateApplicationInput,
  type ReorderApplicationsInput,
  type UpdateApplicationInput,
} from "@trackr/shared";

import {
  ApplicationRepository,
  type ApplicationPatch,
  type ApplicationWithNotes,
} from "./application.repository.js";
import {
  applicationNotFound,
  invalidBoardOrder,
  noteNotFound,
} from "../../utils/httpError.js";

// Converts a row into the wire shape, with the notes newest first.
function toApplication(row: ApplicationWithNotes): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    jobUrl: row.jobUrl,
    location: row.location,
    salary: row.salary,
    jobDescription: row.jobDescription,
    cvFileName: row.cvFileName,
    cvMime: row.cvMime,
    cvSize: row.cvSize,
    status: row.status,
    appliedAt: row.appliedAt.toISOString(),
    lastActivityAt: row.lastActivityAt.toISOString(),
    notes: row.notes.map((note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    })),
  };
}

export class ApplicationService {
  constructor(private applicationRepository: ApplicationRepository) {}

  async list(userId: number): Promise<Application[]> {
    const rows = await this.applicationRepository.listByUser(userId);
    return rows.map(toApplication);
  }

  async get(userId: number, id: number): Promise<Application> {
    const row = await this.applicationRepository.findById(userId, id);
    if (!row) {
      throw applicationNotFound();
    }
    return toApplication(row);
  }

  async create(
    userId: number,
    input: CreateApplicationInput,
  ): Promise<Application> {
    const row = await this.applicationRepository.create(userId, {
      company: input.company,
      role: input.role,
      jobUrl: input.jobUrl,
      location: input.location,
      salary: input.salary,
      jobDescription: input.jobDescription,
      status: input.status,
      appliedAt: new Date(input.appliedAt),
    });

    return toApplication(row);
  }

  async update(
    userId: number,
    id: number,
    input: UpdateApplicationInput,
  ): Promise<Application> {
    const { appliedAt, ...fields } = input;

    // appliedAt is only added when it was actually sent. Passing an explicit
    // undefined would leave the patch's meaning up to whether the storage layer
    // happens to ignore undefined, which is not something to rely on for a
    // field that must not be blanked.
    const patch: ApplicationPatch = { ...fields };
    if (appliedAt !== undefined) {
      patch.appliedAt = new Date(appliedAt);
    }

    const row = await this.applicationRepository.update(userId, id, patch);

    if (!row) {
      throw applicationNotFound();
    }

    return toApplication(row);
  }

  async remove(userId: number, id: number): Promise<void> {
    const removed = await this.applicationRepository.remove(userId, id);
    if (!removed) {
      throw applicationNotFound();
    }
  }

  /**
   * Applies a drop.
   *
   * The payload is the whole board, so it has to be checked as a whole: the
   * four lists must between them name every card the user owns, exactly once
   * each. Without that check a stale client could quietly drop a card out of
   * the board entirely, and the next render would show a card that has
   * silently vanished.
   *
   * Which column a card is listed under is what makes it that status, so the
   * stored status is deliberately not compared: at the moment a card is being
   * moved it is still stored in the column it is leaving.
   */
  async reorder(
    userId: number,
    input: ReorderApplicationsInput,
  ): Promise<Application[]> {
    const owned = await this.applicationRepository.listByUser(userId);
    const ownedIds = new Set(owned.map((row) => row.id));

    const seen = new Set<number>();
    for (const status of APPLICATION_STATUSES) {
      for (const id of input.columns[status]) {
        if (!ownedIds.has(id)) {
          // Either a card that is not this user's or one that does not exist.
          // Both are a bad request, and neither is acknowledged individually.
          throw invalidBoardOrder();
        }
        if (seen.has(id)) {
          throw invalidBoardOrder();
        }
        seen.add(id);
      }
    }

    if (seen.size !== ownedIds.size) {
      throw invalidBoardOrder();
    }

    // Only a card that changed column counts as having moved on: the column it
    // was submitted under is the status it is being given. Re-ordering within a
    // column is a tidying gesture, not progress, and bumping the clock for it
    // would quietly clear the "no response yet" badge on cards nobody touched.
    const moved = owned
      .filter((row) => input.columns[row.status].indexOf(row.id) === -1)
      .map((row) => row.id);

    await this.applicationRepository.applyOrder(userId, input.columns, moved);

    const rows = await this.applicationRepository.listByUser(userId);
    return rows.map(toApplication);
  }

  async addNote(
    userId: number,
    applicationId: number,
    input: AddNoteInput,
  ): Promise<{ id: number; body: string; createdAt: string }> {
    const note = await this.applicationRepository.addNote(
      userId,
      applicationId,
      input.body,
    );

    if (!note) {
      throw applicationNotFound();
    }

    return {
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    };
  }

  async removeNote(
    userId: number,
    applicationId: number,
    noteId: number,
  ): Promise<void> {
    const removed = await this.applicationRepository.removeNote(
      userId,
      applicationId,
      noteId,
    );

    if (!removed) {
      throw noteNotFound();
    }
  }

  async saveCv(
    userId: number,
    applicationId: number,
    file: { originalName: string; mime: string; size: number; dataBase64: string },
  ): Promise<Application> {
    const row = await this.applicationRepository.saveCv(
      userId,
      applicationId,
      file,
    );
    if (!row) {
      throw applicationNotFound();
    }
    return toApplication(row);
  }

  async getCv(
    userId: number,
    applicationId: number,
  ): Promise<{ fileName: string; mime: string; size: number; data: Buffer }> {
    const cv = await this.applicationRepository.getCv(userId, applicationId);
    if (!cv) {
      throw applicationNotFound();
    }
    return {
      fileName: cv.fileName,
      mime: cv.mime,
      size: cv.size,
      data: Buffer.from(cv.dataBase64, "base64"),
    };
  }

  async removeCv(userId: number, applicationId: number): Promise<Application> {
    const row = await this.applicationRepository.removeCv(userId, applicationId);
    if (!row) {
      throw applicationNotFound();
    }
    return toApplication(row);
  }

  async getColumnLabels(userId: number): Promise<ColumnLabels> {
    const stored = await this.applicationRepository.getColumnLabels(userId);
    const labels = { ...STATUS_DEFAULT_TITLES } as ColumnLabels;
    for (const status of APPLICATION_STATUSES) {
      const custom = stored[status as ApplicationStatus];
      if (custom) {
        (labels as Record<string, string>)[status] = custom;
      }
    }
    return labels;
  }

  async setColumnLabels(
    userId: number,
    labels: ColumnLabels,
  ): Promise<ColumnLabels> {
    await this.applicationRepository.setColumnLabels(userId, labels);
    return this.getColumnLabels(userId);
  }
}
