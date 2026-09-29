import { usersTable, sessionsTable } from "../../db/schema.js";
import { db } from "../../db/index.js";
import { eq, lt } from "drizzle-orm";

export class AuthRepository {
  async findUserByEmail(email: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return user;
  }

  async findUserById(id: number) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return user;
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
  }) {
    const [newUser] = await db.insert(usersTable).values(userData).returning();
    return newUser;
  }

  // save a new session in the database with the hashed refresh token
  async createSession(session: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const [created] = await db
      .insert(sessionsTable)
      .values(session)
      .returning();
    return created;
  }

  async findSessionByTokenHash(tokenHash: string) {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.tokenHash, tokenHash));
    return session;
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    await db
      .delete(sessionsTable)
      .where(eq(sessionsTable.tokenHash, tokenHash));
  }

  async deleteExpiredSessions() {
    await db
      .delete(sessionsTable)
      .where(lt(sessionsTable.expiresAt, new Date()));
  }
}
