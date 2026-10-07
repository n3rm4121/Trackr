import type { AuthRepository } from "../../auth.repository.js";
import { hashPasswordResetToken } from "../../../../utils/token.js";

type UserRow = {
  id: number;
  email: string;
  name: string;
  password: string;
  tokenVersion: number;
};

type PasswordResetTokenRow = {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
};

/**
 * In-memory stand-in for AuthRepository. Keeps the real contract, including
 * returning a single user rather than an array, so service logic is exercised
 * without a database.
 */
export class FakeAuthRepository {
  users: UserRow[] = [];
  passwordResetTokens: PasswordResetTokenRow[] = [];
  private nextUserId = 1;

  async findUserByEmail(email: string) {
    return this.users.find((user) => user.email === email);
  }

  async findUserById(id: number) {
    return this.users.find((user) => user.id === id);
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
  }) {
    const user: UserRow = { id: this.nextUserId++, tokenVersion: 1, ...userData };
    this.users.push(user);
    return user;
  }

  async updateUserPassword(userId: number, password: string) {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (user) {
      user.password = password;
    }
    return user;
  }

  async incrementTokenVersion(userId: number) {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (user) {
      user.tokenVersion += 1;
    }
    return user;
  }

  async createPasswordResetToken(token: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const row: PasswordResetTokenRow = {
      id: this.passwordResetTokens.length + 1,
      ...token,
    };
    this.passwordResetTokens.push(row);
    return row;
  }

  async findPasswordResetTokenByHash(tokenHash: string) {
    return this.passwordResetTokens.find(
      (token) => token.tokenHash === tokenHash,
    );
  }

  async deletePasswordResetTokenByHash(tokenHash: string) {
    this.passwordResetTokens = this.passwordResetTokens.filter(
      (token) => token.tokenHash !== tokenHash,
    );
  }

  async deletePasswordResetTokensByUserId(userId: number) {
    this.passwordResetTokens = this.passwordResetTokens.filter(
      (token) => token.userId !== userId,
    );
  }

  async deleteExpiredPasswordResetTokens() {
    const now = Date.now();
    this.passwordResetTokens = this.passwordResetTokens.filter(
      (token) => token.expiresAt.getTime() > now,
    );
  }

  /** Mirrors the real lookup for a reset link's raw token. */
  findPasswordResetByRawToken(raw: string) {
    return this.passwordResetTokens.find(
      (token) => token.tokenHash === hashPasswordResetToken(raw),
    );
  }
}

export const asRepository = (fake: FakeAuthRepository) =>
  fake as unknown as AuthRepository;
