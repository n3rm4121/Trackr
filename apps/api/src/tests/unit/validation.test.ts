import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { z } from "zod";

import {
  parseBody,
  parseParams,
  toValidationIssues,
} from "../../utils/validation.js";

const schema = z.object({
  email: z.email(),
  count: z.number().int(),
});

const makeRes = () => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
};

describe("toValidationIssues", () => {
  it("joins the issue path into a dotted field name", () => {
    const nested = z.object({ user: z.object({ email: z.email() }) });
    const result = nested.safeParse({ user: { email: "bad" } });

    expect(result.success).toBe(false);
    expect(toValidationIssues(result.error!)).toEqual([
      { field: "user.email", message: expect.any(String) },
    ]);
  });

  it("uses an empty field for an issue that belongs to no field", () => {
    const result = z.object({ a: z.string() }).safeParse({ a: 1 });

    expect(result.success).toBe(false);
    expect(toValidationIssues(result.error!)[0]?.field).toBe("a");
  });
});

describe("parseBody", () => {
  it("returns the parsed value when the body is valid", () => {
    const res = makeRes();
    const req = { body: { email: "a@b.com", count: 3 } } as Request;

    const result = parseBody(schema, req, res);

    expect(result).toEqual({ email: "a@b.com", count: 3 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("answers 400 with the shared validation error shape", async () => {
    const { validationErrorSchema } = await import("@job-kanban/shared");
    const res = makeRes();
    const req = { body: { email: "nope", count: 1.5 } } as Request;

    const result = parseBody(schema, req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);

    // The body the API sends is validated against the same contract the
    // frontend parses, so this cannot drift.
    const body = res.json.mock.calls[0]?.[0];
    expect(validationErrorSchema.safeParse(body).success).toBe(true);
    expect(body.issues.map((issue: { field: string }) => issue.field)).toEqual([
      "email",
      "count",
    ]);
  });

  it("rejects a missing body rather than throwing", () => {
    const res = makeRes();
    const req = { body: undefined } as unknown as Request;

    expect(parseBody(schema, req, res)).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("does not mutate req.body", () => {
    const res = makeRes();
    const body = { email: "  A@B.COM ", count: 3 };
    const req = { body } as Request;

    parseBody(
      z.object({ email: z.string().trim().toLowerCase(), count: z.number() }),
      req,
      res,
    );

    expect(req.body).toBe(body);
    expect(body.email).toBe("  A@B.COM ");
  });
});

describe("parseParams", () => {
  const idSchema = z.object({ id: z.coerce.number().int().positive() });

  it("returns the parsed path params", () => {
    const res = makeRes();
    const req = { params: { id: "12" } } as unknown as Request;

    expect(parseParams(idSchema, req, res)).toEqual({ id: 12 });
  });

  it("answers 400 and returns null when a path id is not usable", () => {
    const res = makeRes();
    const req = { params: { id: "abc" } } as unknown as Request;

    expect(parseParams(idSchema, req, res)).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("reports the offending param by name", () => {
    const res = makeRes();
    const req = { params: { id: "0" } } as unknown as Request;

    parseParams(idSchema, req, res);

    const payload = res.json.mock.calls[0][0] as {
      code: string;
      issues: { field: string }[];
    };
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.issues[0]?.field).toBe("id");
  });

  it("does not mutate req.params", () => {
    const res = makeRes();
    const params = { id: " 12 " };
    const req = { params } as unknown as Request;

    parseParams(idSchema, req, res);

    expect(req.params).toBe(params);
    expect(params.id).toBe(" 12 ");
  });
});
