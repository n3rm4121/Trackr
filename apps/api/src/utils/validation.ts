import type { Request, Response } from "express";
import type { ZodError, ZodType, output } from "zod";

import {
  validationErrorSchema,
  type ValidationIssue,
} from "@job-kanban/shared";

// turns validation failure into http response

// flattens a ZodError into the wire shape validationErrorSchema describes.
export function toValidationIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * parses a request body with a shared schema, answering 400 and returning null
 * when it does not match. A null return means the caller must stop: the
 * response has already been sent.
 *
 * The parsed value is returned rather than req.body mutated, so a handler
 * cannot accidentally keep using unvalidated input.
 */
export function parseBody<S extends ZodType>(
  schema: S,
  req: Request,
  res: Response,
): output<S> | null {
  return parseWith(schema, req.body, res);
}

/**
 * The same guard for values that are not the body: a path id, or a query
 * string. A route parameter arrives as a string, so this is where "12" becomes
 * a number — and where "abc" becomes a 400 rather than a query for id NaN.
 */
export function parseParams<S extends ZodType>(
  schema: S,
  req: Request,
  res: Response,
): output<S> | null {
  return parseWith(schema, req.params, res);
}

function parseWith<S extends ZodType>(
  schema: S,
  value: unknown,
  res: Response,
): output<S> | null {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  res.status(400).json(
    validationErrorSchema.parse({
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      issues: toValidationIssues(result.error),
    }),
  );

  return null;
}
