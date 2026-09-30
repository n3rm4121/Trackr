import { describe, it, expect } from "vitest";

import {
  addNoteInputSchema,
  applicationResponseSchema,
  applicationSchema,
  applicationStatusSchema,
  applicationsResponseSchema,
  createApplicationInputSchema,
  idParamSchema,
  noteIdParamSchema,
  reorderApplicationsInputSchema,
  updateApplicationInputSchema,
  type Application,
  type CreateApplicationInput,
} from "./application.schema.js";

/**
 * These mirror what the applications controller reads off the request and
 * writes to the response, and what the web parses out of the response. A change
 * to either side that breaks the other has to fail here.
 */

const iso = "2026-09-30T09:15:00.000Z";

const validApplication: Application = {
  id: 7,
  company: "Stripe",
  role: "Frontend Engineer",
  jobUrl: "https://stripe.com/jobs/frontend-engineer",
  location: "Dublin, IE · Hybrid",
  salary: "€95k – €115k",
  status: "applied",
  appliedAt: iso,
  lastActivityAt: iso,
  notes: [{ id: 1, body: "Referred by Dana.", createdAt: iso }],
};

describe("applicationStatusSchema", () => {
  it("accepts the four board columns", () => {
    for (const status of ["applied", "interview", "offer", "rejected"]) {
      expect(applicationStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects a status the board has no column for", () => {
    const result = applicationStatusSchema.safeParse("ghosted");

    expect(result.success).toBe(false);
  });
});

describe("createApplicationInputSchema", () => {
  const valid: CreateApplicationInput = {
    company: "Stripe",
    role: "Frontend Engineer",
    jobUrl: "https://stripe.com/jobs/frontend-engineer",
    location: "Dublin, IE",
    salary: "€95k",
    status: "applied",
    appliedAt: iso,
  };

  it("accepts a well-formed application", () => {
    expect(createApplicationInputSchema.safeParse(valid).success).toBe(true);
  });

  it("trims text so padding never reaches the database", () => {
    const result = createApplicationInputSchema.safeParse({
      ...valid,
      company: "  Stripe  ",
    });

    expect(result.success && result.data.company).toBe("Stripe");
  });

  it("defaults the status to the first column", () => {
    const { status: _status, ...withoutStatus } = valid;
    const result = createApplicationInputSchema.safeParse(withoutStatus);

    expect(result.success && result.data.status).toBe("applied");
  });

  it("defaults the optional fields to empty strings", () => {
    const { jobUrl: _jobUrl, location: _location, salary: _salary, ...minimal } =
      valid;
    const result = createApplicationInputSchema.safeParse(minimal);

    expect(result.success).toBe(true);
    expect(result.success && result.data.jobUrl).toBe("");
    expect(result.success && result.data.location).toBe("");
    expect(result.success && result.data.salary).toBe("");
  });

  it("rejects a blank company", () => {
    const result = createApplicationInputSchema.safeParse({
      ...valid,
      company: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a company longer than the column allows", () => {
    const result = createApplicationInputSchema.safeParse({
      ...valid,
      company: "x".repeat(256),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a job URL that is not a link, so a card has no dead button", () => {
    const result = createApplicationInputSchema.safeParse({
      ...valid,
      jobUrl: "stripe.com/jobs",
    });

    expect(result.success).toBe(false);
  });

  it("allows an empty job URL", () => {
    const result = createApplicationInputSchema.safeParse({
      ...valid,
      jobUrl: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a date the client could not have meant", () => {
    const result = createApplicationInputSchema.safeParse({
      ...valid,
      appliedAt: "2026-13-45",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateApplicationInputSchema", () => {
  it("accepts a single changed field", () => {
    const result = updateApplicationInputSchema.safeParse({ status: "offer" });

    expect(result.success).toBe(true);
  });

  it("rejects an empty patch rather than answering 200 for nothing", () => {
    const result = updateApplicationInputSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects a patch whose only key is a typo, since nothing survives stripping", () => {
    const result = updateApplicationInputSchema.safeParse({ compny: "Stripe" });

    expect(result.success).toBe(false);
  });

  it("drops a mistyped extra key rather than storing it", () => {
    const result = updateApplicationInputSchema.safeParse({
      status: "offer",
      compny: "Stripe",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({ status: "offer" });
  });

  it("leaves untouched fields absent so a move cannot blank them", () => {
    const result = updateApplicationInputSchema.safeParse({ status: "offer" });

    expect(result.success && result.data).toEqual({ status: "offer" });
    expect(result.success && "jobUrl" in result.data).toBe(false);
    expect(result.success && "location" in result.data).toBe(false);
    expect(result.success && "salary" in result.data).toBe(false);
  });
});

describe("reorderApplicationsInputSchema", () => {
  const valid = {
    columns: { applied: [3, 1], interview: [9], offer: [4], rejected: [] },
  };

  it("accepts the four ordered columns", () => {
    expect(reorderApplicationsInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a column holding a non-positive id", () => {
    const result = reorderApplicationsInputSchema.safeParse({
      columns: { ...valid.columns, applied: [0] },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payload missing a column, so no card is dropped by omission", () => {
    const { rejected: _rejected, ...partial } = valid.columns;
    const result = reorderApplicationsInputSchema.safeParse({
      columns: partial,
    });

    expect(result.success).toBe(false);
  });
});

describe("addNoteInputSchema", () => {
  it("trims and accepts a real note", () => {
    const result = addNoteInputSchema.safeParse({ body: "  Kicking things off.  " });

    expect(result.success && result.data.body).toBe("Kicking things off.");
  });

  it("rejects an empty note", () => {
    expect(addNoteInputSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("rejects a note past the limit", () => {
    expect(
      addNoteInputSchema.safeParse({ body: "x".repeat(2001) }).success,
    ).toBe(false);
  });
});

describe("idParamSchema", () => {
  it("coerces the string id a path segment arrives as", () => {
    const result = idParamSchema.safeParse({ id: "12" });

    expect(result.success && result.data.id).toBe(12);
  });

  it("rejects an id that is not a positive integer", () => {
    expect(idParamSchema.safeParse({ id: "abc" }).success).toBe(false);
    expect(idParamSchema.safeParse({ id: "0" }).success).toBe(false);
  });

  it("reads both ids off a note path", () => {
    const result = noteIdParamSchema.safeParse({ id: "3", noteId: "9" });

    expect(result.success && result.data.noteId).toBe(9);
  });
});

describe("applicationSchema", () => {
  it("accepts a row straight out of the database", () => {
    expect(applicationSchema.safeParse(validApplication).success).toBe(true);
  });

  it("requires notes, so the detail panel never has to guess", () => {
    const { notes: _notes, ...withoutNotes } = validApplication;

    expect(applicationSchema.safeParse(withoutNotes).success).toBe(false);
  });

  it("wraps a single application for the response", () => {
    const result = applicationResponseSchema.safeParse({
      application: validApplication,
    });

    expect(result.success).toBe(true);
  });

  it("wraps the whole board for the list response", () => {
    const result = applicationsResponseSchema.safeParse({
      applications: [validApplication],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a board where one card is a stranger's status", () => {
    const result = applicationsResponseSchema.safeParse({
      applications: [{ ...validApplication, status: "ghosted" }],
    });

    expect(result.success).toBe(false);
  });
});
