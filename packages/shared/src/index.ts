/**
 * Single entry point for @job-kanban/shared.
 *
 * Every contract is a Zod schema; the TypeScript types beside it are inferred
 * with z.infer, so the two can never drift. Consumers get the schema for
 * runtime validation (parsing a request, validating a response in a test) and
 * the type for compile-time checking, from the same declaration.
 */
export * from "./schemas/user.schema.js";
export * from "./schemas/auth.schema.js";
export * from "./schemas/api.schema.js";
export * from "./schemas/application.schema.js";
