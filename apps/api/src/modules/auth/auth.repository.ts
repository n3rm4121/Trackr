import { eq, lt } from "drizzle-orm";

import {
  passwordResetTokensTable,
  sessionsTable,
  usersTable,
} from "../../db/schema.js";
import { db } from "../../db/index.js";

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

  async updateUserPassword(userId: number, password: string) {
    const [updated] = await db
      .update(usersTable)
      .set({ password })
      .where(eq(usersTable.id, userId))
      .returning();
    return updated;
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

  async deleteSessionsByUserId(userId: number) {
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
  }

  async deleteExpiredSessions() {
    await db
      .delete(sessionsTable)
      .where(lt(sessionsTable.expiresAt, new Date()));
  }

  async createPasswordResetToken(token: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const [created] = await db
      .insert(passwordResetTokensTable)
      .values(token)
      .returning();
    return created;
  }

  async findPasswordResetTokenByHash(tokenHash: string) {
    const [token] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.tokenHash, tokenHash));
    return token;
  }

  async deletePasswordResetTokenByHash(tokenHash: string) {
    await db
      .delete(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.tokenHash, tokenHash));
  }

  // Requesting a new link retires the old ones, so only the newest works.
  async deletePasswordResetTokensByUserId(userId: number) {
    await db
      .delete(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.userId, userId));
  }

  async deleteExpiredPasswordResetTokens() {
    await db
      .delete(passwordResetTokensTable)
      .where(lt(passwordResetTokensTable.expiresAt, new Date()));
  }
}
