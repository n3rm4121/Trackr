import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, code: err.code });
    return;
  }

  // Anything unexpected may contain internals, so log it but return a
  // generic message to the client.
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
};
