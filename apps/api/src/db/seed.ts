import { eq } from "drizzle-orm";

import { db, pool } from "./index.js";
import { usersTable } from "./schema.js";
import { ApplicationRepository } from "../modules/applications/application.repository.js";
import { STARTER_APPLICATION, STARTER_NOTE } from "./starter-application.js";

/**
 * Fills an existing account with the example card new signups start with.
 *
 * Usage: pnpm db:seed -- <email>
 */
const email = process.argv[2];

if (!email) {
  console.error("Usage: pnpm db:seed -- <email>");
  process.exit(1);
}

const [user] = await db
  .select({ id: usersTable.id })
  .from(usersTable)
  .where(eq(usersTable.email, email));

if (!user) {
  console.error(`No account found for "${email}"`);
  process.exit(1);
}

const applications = new ApplicationRepository();
const card = await applications.create(user.id, {
  ...STARTER_APPLICATION,
  appliedAt: new Date(),
});
await applications.addNote(user.id, card.id, STARTER_NOTE);

console.log(`Seeded example application #${card.id} for ${email}`);
await pool.end();
