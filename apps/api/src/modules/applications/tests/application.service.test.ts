import { describe, it, expect, beforeEach } from "vitest";

import {
  addNoteInputSchema,
  createApplicationInputSchema,
  reorderApplicationsInputSchema,
  type ApplicationStatus,
} from "@job-kanban/shared";

import { ApplicationService } from "../application.service.js";
import {
  FakeApplicationRepository,
  asRepository,
} from "./helpers/fakeApplicationRepository.js";
import { HttpError } from "../../../utils/httpError.js";

/**
 * The service owns two decisions worth testing away from a database: that a
 * card is only ever visible to the user who owns it, and that a drop describes
 * a board that actually exists. Position arithmetic is tested against a real
 * Postgres in the integration suite instead.
 */

const owner = 1;
const stranger = 2;

let fake: FakeApplicationRepository;
let service: ApplicationService;

beforeEach(() => {
  fake = new FakeApplicationRepository();
  service = new ApplicationService(asRepository(fake));
});

/** The payload the controller hands the service, parsed by the real schema
 *  so a malformed one cannot quietly pass here. */
function order(ids: Partial<Record<ApplicationStatus, number[]>>) {
  return reorderApplicationsInputSchema.parse({
    columns: {
      applied: ids.applied ?? [],
      interview: ids.interview ?? [],
      offer: ids.offer ?? [],
      rejected: ids.rejected ?? [],
    },
  });
}

describe("list", () => {
  it("returns only the caller's cards", async () => {
    fake.given(owner, { status: "applied", company: "Stripe" });
    fake.given(stranger, { status: "applied", company: "Notion" });

    const applications = await service.list(owner);

    expect(applications.map((a) => a.company)).toEqual(["Stripe"]);
  });

  it("returns notes newest first", async () => {
    const older = { id: 1, body: "first", createdAt: new Date("2026-01-01T00:00:00.000Z") };
    const newer = { id: 2, body: "second", createdAt: new Date("2026-02-01T00:00:00.000Z") };
    fake.given(owner, { status: "applied", notes: [newer, older] });

    const [application] = await service.list(owner);

    expect(application.notes.map((note) => note.body)).toEqual([
      "second",
      "first",
    ]);
  });

  it("serialises timestamps as ISO strings, not Date objects", async () => {
    fake.given(owner, { status: "applied" });

    const [application] = await service.list(owner);

    expect(application.appliedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(typeof application.lastActivityAt).toBe("string");
  });
});

describe("get", () => {
  it("finds a card the caller owns", async () => {
    const card = fake.given(owner, { status: "applied", company: "Stripe" });

    const application = await service.get(owner, card.id);

    expect(application.company).toBe("Stripe");
  });

  it("answers 404 for another user's card rather than 403", async () => {
    // 403 would confirm the card exists, which is itself a leak.
    const card = fake.given(stranger, { status: "applied" });

    await expect(service.get(owner, card.id)).rejects.toMatchObject({
      status: 404,
      code: "APPLICATION_NOT_FOUND",
    });
  });

  it("answers 404 for a card that does not exist at all", async () => {
    await expect(service.get(owner, 999)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("create", () => {
  it("stores a card and returns it in the wire shape", async () => {
    const application = await service.create(
      owner,
      // Parsed, as the controller does: the service is handed clean input and
      // is not where the trimming happens.
      createApplicationInputSchema.parse({
        company: "  Stripe  ",
        role: "Frontend Engineer",
        jobUrl: "https://stripe.com/jobs/frontend-engineer",
        location: "Dublin",
        salary: "€95k",
        status: "applied",
        appliedAt: "2026-09-01T10:00:00.000Z",
      }),
    );

    expect(application.company).toBe("Stripe");
    expect(application.notes).toEqual([]);
  });
});

describe("update", () => {
  it("changes only the fields it was given", async () => {
    const card = fake.given(owner, {
      status: "applied",
      company: "Stripe",
      jobUrl: "https://stripe.com/jobs",
      location: "Dublin",
      salary: "€95k",
    });

    const updated = await service.update(owner, card.id, { company: "Stripe Inc" });

    expect(updated.company).toBe("Stripe Inc");
    expect(updated.jobUrl).toBe("https://stripe.com/jobs");
    expect(updated.location).toBe("Dublin");
    expect(updated.salary).toBe("€95k");
  });

  it("converts the applied date to a Date the repository can store", async () => {
    const card = fake.given(owner, { status: "applied" });

    const updated = await service.update(owner, card.id, {
      appliedAt: "2026-09-15T08:30:00.000Z",
    });

    expect(updated.appliedAt).toBe("2026-09-15T08:30:00.000Z");
  });

  it("cannot reach another user's card", async () => {
    const card = fake.given(stranger, { status: "applied", company: "Notion" });

    await expect(
      service.update(owner, card.id, { company: "Hijacked" }),
    ).rejects.toMatchObject({ status: 404 });

    expect(
      fake.all().find((row) => row.id === card.id)?.company,
    ).toBe("Notion");
  });
});

describe("remove", () => {
  it("deletes a card the caller owns", async () => {
    const card = fake.given(owner, { status: "applied" });

    await service.remove(owner, card.id);

    await expect(service.list(owner)).resolves.toEqual([]);
  });

  it("refuses to delete another user's card", async () => {
    const card = fake.given(stranger, { status: "applied" });

    await expect(service.remove(owner, card.id)).rejects.toMatchObject({
      status: 404,
    });
    expect(fake.all()).toHaveLength(1);
  });
});

describe("reorder", () => {
  it("applies an order that covers the whole board", async () => {
    const a = fake.given(owner, { status: "applied" });
    const b = fake.given(owner, { status: "applied" });

    await service.reorder(owner, order({ applied: [b.id, a.id] }));

    expect(fake.lastAppliedOrder).toEqual({
      applied: [b.id, a.id],
      interview: [],
      offer: [],
      rejected: [],
    });
  });

  it("accepts a card moved into a different column", async () => {
    // The whole point of a drop. The card is still stored as an interview when
    // the payload arrives, so comparing the two would refuse every real drag.
    const moving = fake.given(owner, { status: "interview" });

    await service.reorder(owner, order({ applied: [moving.id] }));

    expect(fake.lastAppliedOrder?.applied).toEqual([moving.id]);
  });

  it("only counts a card as moved when it changed column", async () => {
    // The silence clock behind the "no response" badge must survive someone
    // tidying a column. Bumping every card on every drop would quietly clear
    // the badge on cards nobody touched.
    const staying = fake.given(owner, { status: "applied" });
    const moving = fake.given(owner, { status: "applied" });

    await service.reorder(
      owner,
      order({ applied: [staying.id], interview: [moving.id] }),
    );

    expect(fake.lastMoved).toEqual([moving.id]);
  });

  it("counts no card as moved when the order is unchanged", async () => {
    const a = fake.given(owner, { status: "applied" });
    const b = fake.given(owner, { status: "offer" });

    await service.reorder(owner, order({ applied: [a.id], offer: [b.id] }));

    expect(fake.lastMoved).toEqual([]);
  });

  it("rejects an order that leaves a card out, so a drop cannot delete it", async () => {
    const a = fake.given(owner, { status: "applied" });
    fake.given(owner, { status: "applied" });

    await expect(
      service.reorder(owner, order({ applied: [a.id] })),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_BOARD_ORDER" });

    expect(fake.lastAppliedOrder).toBeNull();
  });

  it("rejects the same card listed twice", async () => {
    const a = fake.given(owner, { status: "applied" });

    await expect(
      service.reorder(owner, order({ applied: [a.id, a.id] })),
    ).rejects.toMatchObject({ code: "INVALID_BOARD_ORDER" });
  });

  it("rejects another user's card, and says nothing about which id was wrong", async () => {
    const mine = fake.given(owner, { status: "applied" });
    const theirs = fake.given(stranger, { status: "applied" });

    const error = await service
      .reorder(owner, order({ applied: [mine.id, theirs.id] }))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(400);
    expect((error as HttpError).message).not.toContain(String(theirs.id));
    expect(fake.lastAppliedOrder).toBeNull();
  });

  it("rejects an order built from another user's board", async () => {
    const theirs = fake.given(stranger, { status: "applied" });

    // The caller sends a complete, self-consistent order that simply is not
    // theirs. Seen.size will not match their empty board.
    await expect(
      service.reorder(owner, order({ applied: [theirs.id] })),
    ).rejects.toMatchObject({ code: "INVALID_BOARD_ORDER" });
  });

  it("an empty board is a valid order", async () => {
    await expect(service.reorder(owner, order({}))).resolves.toEqual([]);
  });
});

describe("notes", () => {
  it("adds a note to a card the caller owns", async () => {
    const card = fake.given(owner, { status: "applied" });

    const note = await service.addNote(
      owner,
      card.id,
      addNoteInputSchema.parse({ body: "  Kicking things off.  " }),
    );

    expect(note.body).toBe("Kicking things off.");
  });

  it("answers 404 when the card is not the caller's", async () => {
    const card = fake.given(stranger, { status: "applied" });

    await expect(
      service.addNote(owner, card.id, { body: "sneaky" }),
    ).rejects.toMatchObject({ status: 404, code: "APPLICATION_NOT_FOUND" });

    expect(fake.all()[0].notes).toEqual([]);
  });

  it("removes a note from a card the caller owns", async () => {
    const card = fake.given(owner, {
      status: "applied",
      notes: [
        { id: 5, body: "keep", createdAt: new Date("2026-02-01T00:00:00.000Z") },
        { id: 6, body: "drop", createdAt: new Date("2026-01-01T00:00:00.000Z") },
      ],
    });

    await service.removeNote(owner, card.id, 6);

    expect(fake.all()[0].notes.map((note) => note.body)).toEqual(["keep"]);
  });

  it("answers 404 when the note is not there", async () => {
    const card = fake.given(owner, { status: "applied" });

    await expect(service.removeNote(owner, card.id, 404)).rejects.toMatchObject({
      status: 404,
      code: "NOTE_NOT_FOUND",
    });
  });
});
