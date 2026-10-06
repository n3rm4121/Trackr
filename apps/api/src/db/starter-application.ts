/**
 * The single example card a new account starts with, so a fresh board is
 * never blank. Shared by signup seeding (AuthService) and the manual
 * `pnpm db:seed -- <email>` script, so both create the same card.
 */
export const STARTER_APPLICATION = {
  company: "Example Corp",
  role: "Frontend Engineer",
  jobUrl: "",
  location: "Remote",
  salary: "",
  jobDescription:
    "This is an example to show you around — edit it into your first real application, or delete it and add your own.",
  status: "applied",
} as const;

export const STARTER_NOTE =
  "Welcome to Trackr! Drag this card to Screening when you hear back. Attach the CV you sent so each job keeps its own version.";
