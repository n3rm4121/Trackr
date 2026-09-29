import type { AuthRepository } from "../../auth.repository.js";
import { hashRefreshToken } from "../../../../utils/token.js";

type UserRow = {
  id: number;
  email: string;
  name: string;
  password: string;
};

type SessionRow = {
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
  sessions: SessionRow[] = [];
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
    const user: UserRow = { id: this.nextUserId++, ...userData };
    this.users.push(user);
    return user;
  }

  async createSession(session: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const row: SessionRow = { id: this.sessions.length + 1, ...session };
    this.sessions.push(row);
    return row;
  }

  async findSessionByTokenHash(tokenHash: string) {
    return this.sessions.find((session) => session.tokenHash === tokenHash);
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    this.sessions = this.sessions.filter(
      (session) => session.tokenHash !== tokenHash,
    );
  }

  sessionCount() {
    return this.sessions.length;
  }

  /** Mirrors the real lookup: hash the presented token, then find it. */
  findByRawToken(raw: string) {
    return this.sessions.find(
      (session) => session.tokenHash === hashRefreshToken(raw),
    );
  }
}

export const asRepository = (fake: FakeAuthRepository) =>
  fake as unknown as AuthRepository;
