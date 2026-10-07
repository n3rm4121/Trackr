import { eq, lt, sql } from "drizzle-orm";

import {
  passwordResetTokensTable,
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

  // Retires every outstanding refresh token: they carry the version they
  // were issued at, and refresh refuses anything older than this.
  async incrementTokenVersion(userId: number) {
    const [updated] = await db
      .update(usersTable)
      .set({ tokenVersion: sql`${usersTable.tokenVersion} + 1` })
      .where(eq(usersTable.id, userId))
      .returning();
    return updated;
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
