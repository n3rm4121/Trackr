import { z } from "zod";

// Ids are integers because the database assigns them. The web still keys its
// board by string (dnd-kit works in strings) and converts at the edge.

export const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const STATUS_DEFAULT_TITLES: Record<
  z.infer<typeof applicationStatusSchema>,
  string
> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview Scheduled",
  offer: "Offer",
  rejected: "Rejected",
};

const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`);

// optional but should be valid
const jobUrl = z
  .string()
  .trim()
  .max(2048, "Job URL must be at most 2048 characters")
  .refine(
    (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
    "Enter a valid job URL starting with http:// or https://",
  );

const isoDate = z.iso.datetime();

export const noteSchema = z.object({
  id: z.number().int(),
  body: z.string(),
  // iso-8601 with a timezone which is what `Date#toISOString` produces.
  createdAt: z.iso.datetime(),
});

export const applicationSchema = z.object({
  id: z.number().int(),
  company: z.string(),
  role: z.string(),
  jobUrl: z.string(),
  location: z.string(),
  salary: z.string(),
  jobDescription: z.string(),
  cvFileName: z.string(),
  cvMime: z.string(),
  cvSize: z.number().int().nonnegative(),
  status: applicationStatusSchema,
  appliedAt: z.iso.datetime(),
  lastActivityAt: z.iso.datetime(),
  // Newest first
  notes: z.array(noteSchema),
});

export const createApplicationInputSchema = z.object({
  company: requiredText(255, "Company"),
  role: requiredText(255, "Role"),
  jobUrl: jobUrl.default(""),
  location: optionalText(255, "Location").default(""),
  salary: optionalText(255, "Salary").default(""),
  jobDescription: optionalText(10000, "Job description").default(""),
  status: applicationStatusSchema.default("applied"),
  appliedAt: isoDate,
});

export const updateApplicationInputSchema = z
  .object({
    company: requiredText(255, "Company").optional(),
    role: requiredText(255, "Role").optional(),
    jobUrl: jobUrl.optional(),
    location: optionalText(255, "Location").optional(),
    salary: optionalText(255, "Salary").optional(),
    jobDescription: optionalText(10000, "Job description").optional(),
    status: applicationStatusSchema.optional(),
    appliedAt: isoDate.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one field to update",
  });

/**
 * A drop sends the whole board rather than an index. Positions are then a pure
 * function of the payload, so two concurrent drops cannot interleave into a
 * half-applied order, and the server never has to reason about what "after this
 * card" meant when the card moved underneath it.
 */
const idListSchema = z.array(z.number().int().positive());

export const reorderApplicationsInputSchema = z.object({
  columns: z.object({
    applied: idListSchema,
    screening: idListSchema,
    interview: idListSchema,
    offer: idListSchema,
    rejected: idListSchema,
  }),
});

export const addNoteInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(2000, "Notes must be at most 2000 characters"),
});

export const applicationsResponseSchema = z.object({
  applications: z.array(applicationSchema),
});

export const applicationResponseSchema = z.object({
  application: applicationSchema,
});

export const noteResponseSchema = z.object({
  note: noteSchema,
});

export const columnLabelSchema = z
  .string()
  .trim()
  .min(1, "Column name is required")
  .max(50, "Column name must be at most 50 characters");

export const columnLabelsSchema = z.object({
  applied: columnLabelSchema,
  screening: columnLabelSchema,
  interview: columnLabelSchema,
  offer: columnLabelSchema,
  rejected: columnLabelSchema,
});

export const updateColumnLabelsInputSchema = z.object({
  labels: columnLabelsSchema,
});

export const columnLabelsResponseSchema = z.object({
  labels: columnLabelsSchema,
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const noteIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  noteId: z.coerce.number().int().positive(),
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type CreateApplicationInput = z.infer<
  typeof createApplicationInputSchema
>;
export type UpdateApplicationInput = z.infer<
  typeof updateApplicationInputSchema
>;
export type ReorderApplicationsInput = z.infer<
  typeof reorderApplicationsInputSchema
>;
export type AddNoteInput = z.infer<typeof addNoteInputSchema>;
export type ColumnLabels = z.infer<typeof columnLabelsSchema>;
export type UpdateColumnLabelsInput = z.infer<
  typeof updateColumnLabelsInputSchema
>;
export type ColumnLabelsResponse = z.infer<typeof columnLabelsResponseSchema>;
export type ApplicationsResponse = z.infer<typeof applicationsResponseSchema>;
export type ApplicationResponse = z.infer<typeof applicationResponseSchema>;
export type NoteResponse = z.infer<typeof noteResponseSchema>;
