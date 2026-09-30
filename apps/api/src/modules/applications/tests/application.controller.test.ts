import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

import { ApplicationController } from "../application.controller.js";
import { ApplicationService } from "../application.service.js";

/**
 * The controller's job is narrow and worth pinning down: turn a bad path id or
 * a bad body into a 400 with per-field messages, and never reach the service
 * with input that has not been parsed.
 */

let serviceInstance: ApplicationService;

vi.mock("../application.service.js");
vi.mocked(ApplicationService).mockImplementation(function () {
  return serviceInstance;
} as never);

const application = {
  id: 7,
  company: "Stripe",
  role: "Frontend Engineer",
  jobUrl: "https://stripe.com/jobs/frontend-engineer",
  location: "Dublin",
  salary: "€95k",
  status: "applied" as const,
  appliedAt: "2026-09-01T10:00:00.000Z",
  lastActivityAt: "2026-09-02T10:00:00.000Z",
  notes: [],
};

describe("ApplicationController", () => {
  let controller: ApplicationController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    serviceInstance = {
      list: vi.fn().mockResolvedValue([application]),
      get: vi.fn().mockResolvedValue(application),
      create: vi.fn().mockResolvedValue(application),
      update: vi.fn().mockResolvedValue(application),
      remove: vi.fn().mockResolvedValue(undefined),
      reorder: vi.fn().mockResolvedValue([application]),
      addNote: vi
        .fn()
        .mockResolvedValue({ id: 1, body: "note", createdAt: "2026-09-01T10:00:00.000Z" }),
      removeNote: vi.fn().mockResolvedValue(undefined),
    } as unknown as ApplicationService;

    controller = new ApplicationController(serviceInstance);

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe("list", () => {
    it("returns the board for the signed-in user", async () => {
      mockReq = { user: { id: 42 } };

      await controller.list(mockReq as Request, mockRes as Response);

      expect(serviceInstance.list).toHaveBeenCalledWith(42);
      expect(mockRes.json).toHaveBeenCalledWith({
        applications: [application],
      });
    });
  });

  describe("get", () => {
    it("coerces the id from the path into a number", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7" } };

      await controller.get(mockReq as Request, mockRes as Response);

      expect(serviceInstance.get).toHaveBeenCalledWith(42, 7);
    });

    it("answers 400 for an id that is not a number, and does not call the service", async () => {
      mockReq = { user: { id: 42 }, params: { id: "abc" } };

      await controller.get(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(serviceInstance.get).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("answers 201 with the created application", async () => {
      mockReq = {
        user: { id: 42 },
        body: {
          company: "Stripe",
          role: "Frontend Engineer",
          jobUrl: "https://stripe.com/jobs/frontend-engineer",
          location: "Dublin",
          salary: "€95k",
          status: "applied",
          appliedAt: "2026-09-01T10:00:00.000Z",
        },
      };

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ application });
    });

    it("answers 400 with per-field issues when the body does not match", async () => {
      mockReq = { user: { id: 42 }, body: { company: "", role: "x" } };

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      const payload = vi.mocked(mockRes.json!).mock.calls[0][0] as {
        code: string;
        issues: { field: string }[];
      };
      expect(payload.code).toBe("VALIDATION_ERROR");
      expect(payload.issues.some((issue) => issue.field === "company")).toBe(true);
      expect(serviceInstance.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("passes through only the fields that were sent", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7" }, body: { status: "offer" } };

      await controller.update(mockReq as Request, mockRes as Response);

      expect(serviceInstance.update).toHaveBeenCalledWith(42, 7, {
        status: "offer",
      });
    });

    it("answers 400 for an empty patch rather than reporting success", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7" }, body: {} };

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(serviceInstance.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("answers 204", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7" } };

      await controller.remove(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe("reorder", () => {
    it("returns the board the database settled on", async () => {
      mockReq = {
        user: { id: 42 },
        body: {
          columns: { applied: [7], interview: [], offer: [], rejected: [] },
        },
      };

      await controller.reorder(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ applications: [application] });
    });

    it("answers 400 when a column is missing from the payload", async () => {
      mockReq = {
        user: { id: 42 },
        body: { columns: { applied: [7], interview: [], offer: [] } },
      };

      await controller.reorder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(serviceInstance.reorder).not.toHaveBeenCalled();
    });
  });

  describe("notes", () => {
    it("answers 201 with the note", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7" }, body: { body: "note" } };

      await controller.addNote(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(serviceInstance.addNote).toHaveBeenCalledWith(42, 7, {
        body: "note",
      });
    });

    it("answers 400 for a blank note", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7" }, body: { body: "   " } };

      await controller.addNote(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(serviceInstance.addNote).not.toHaveBeenCalled();
    });

    it("reads both ids off the note path", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7", noteId: "3" } };

      await controller.removeNote(mockReq as Request, mockRes as Response);

      expect(serviceInstance.removeNote).toHaveBeenCalledWith(42, 7, 3);
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it("answers 400 when the note id is not a number", async () => {
      mockReq = { user: { id: 42 }, params: { id: "7", noteId: "nope" } };

      await controller.removeNote(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(serviceInstance.removeNote).not.toHaveBeenCalled();
    });
  });
});
