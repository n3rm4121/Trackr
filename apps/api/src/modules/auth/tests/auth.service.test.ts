import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { AuthService } from "../auth.service.js";
import { verifyAccessToken, hashRefreshToken } from "../../../utils/token.js";
import { FakeAuthRepository, asRepository } from "./helpers/fakeRepository.js";

const CREDENTIALS = {
  email: "user@example.com",
  password: "correct-horse",
  name: "Test User",
};

/**
 * These exercise AuthService against an in-memory repository, so the real
 * bcrypt hashing, JWT signing and refresh rotation all run. Password handling
 * and token storage are the parts most likely to break silently.
 */
describe("AuthService", () => {
  let repo: FakeAuthRepository;
  let service: AuthService;

  beforeEach(() => {
    repo = new FakeAuthRepository();
    service = new AuthService(asRepository(repo));
  });

  const registerUser = () => service.register(CREDENTIALS);

  describe("register", () => {
    it("stores a bcrypt hash rather than the plain password", async () => {
      await registerUser();

      const stored = repo.users[0]!;
      expect(stored.password).not.toBe(CREDENTIALS.password);
      expect(stored.password).toMatch(/^\$2[aby]\$/);
    });

    it("returns the user without the password", async () => {
      const user = await registerUser();

      expect(user).toEqual({
        id: expect.any(Number),
        email: CREDENTIALS.email,
        name: CREDENTIALS.name,
      });
      expect(user).not.toHaveProperty("password");
    });

    it("rejects a duplicate email", async () => {
      await registerUser();

      await expect(registerUser()).rejects.toThrow(
        "Email already registered",
      );
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await registerUser();
    });

    it("issues an access token identifying the user", async () => {
      const result = await service.login(CREDENTIALS);
      const registered = repo.users[0]!;

      expect(verifyAccessToken(result.accessToken).userId).toBe(registered.id);
    });

    it("persists only the hash of the refresh token", async () => {
      const result = await service.login(CREDENTIALS);
      const stored = repo.sessions[0]!;

      expect(stored.tokenHash).not.toBe(result.refreshToken);
      expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("never stores the raw refresh token", async () => {
      const result = await service.login(CREDENTIALS);

      expect(repo.findByRawToken(result.refreshToken)).toBeDefined();
      expect(
        repo.sessions.some((s) => s.tokenHash === result.refreshToken),
      ).toBe(false);
    });

    it("omits the password from the response", async () => {
      const result = await service.login(CREDENTIALS);

      expect(result.user).not.toHaveProperty("password");
    });

    it("rejects a wrong password with 401", async () => {
      await expect(
        service.login({ ...CREDENTIALS, password: "wrong" }),
      ).rejects.toMatchObject({
        status: 401,
        code: "INVALID_CREDENTIALS",
      });
    });

    /**
     * A different message for "no such user" would let an attacker enumerate
     * which emails are registered.
     */
    it("gives the same error for an unknown email as for a bad password", async () => {
      const badPassword = await service
        .login({ ...CREDENTIALS, password: "wrong" })
        .catch((error: Error) => error.message);
      const unknownEmail = await service
        .login({ ...CREDENTIALS, email: "nobody@example.com" })
        .catch((error: Error) => error.message);

      expect(unknownEmail).toBe(badPassword);
    });

    it("creates a separate session per login", async () => {
      await service.login(CREDENTIALS);
      await service.login(CREDENTIALS);

      expect(repo.sessionCount()).toBe(2);
    });
  });

  describe("refresh", () => {
    let login: Awaited<ReturnType<AuthService["login"]>>;

    beforeEach(async () => {
      await registerUser();
      login = await service.login(CREDENTIALS);
    });

    it("issues a new access token for the same user", async () => {
      const result = await service.refresh(login.refreshToken);

      expect(verifyAccessToken(result.accessToken)).toEqual(
        verifyAccessToken(login.accessToken),
      );
    });

    it("rotates the refresh token", async () => {
      const result = await service.refresh(login.refreshToken);

      expect(result.refreshToken).not.toBe(login.refreshToken);
    });

    /**
     * Rotation is what limits the damage if a token leaks: the second use of
     * an already-used token is treated as a replay and refused.
     */
    it("rejects a refresh token that has already been used", async () => {
      await service.refresh(login.refreshToken);

      await expect(service.refresh(login.refreshToken)).rejects.toMatchObject({
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    });

    it("leaves one session behind after rotating", async () => {
      await service.refresh(login.refreshToken);

      expect(repo.sessionCount()).toBe(1);
    });

    it("rejects an unknown token", async () => {
      await expect(service.refresh("never-issued")).rejects.toMatchObject({
        status: 401,
      });
    });

    it("rejects an expired session and deletes it", async () => {
      const user = repo.users[0]!;
      await repo.createSession({
        userId: user.id,
        tokenHash: hashRefreshToken("expired-token"),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh("expired-token")).rejects.toMatchObject({
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
      });

      // only the login session should remain; the expired one is cleaned up
      expect(repo.sessionCount()).toBe(1);
    });

    it("rejects a session whose user no longer exists, and deletes it", async () => {
      const orphanToken = "orphan-token";
      await repo.createSession({
        userId: 9999,
        tokenHash: hashRefreshToken(orphanToken),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.refresh(orphanToken)).rejects.toMatchObject({
        status: 401,
      });
      expect(repo.sessionCount()).toBe(1);
    });
  });

  describe("logout", () => {
    it("deletes the session so the token stops working", async () => {
      await registerUser();
      const login = await service.login(CREDENTIALS);

      await service.logout(login.refreshToken);

      expect(repo.sessionCount()).toBe(0);
      await expect(service.refresh(login.refreshToken)).rejects.toMatchObject({
        status: 401,
      });
    });

    it("leaves other sessions of the same user alone", async () => {
      await registerUser();
      const first = await service.login(CREDENTIALS);
      const second = await service.login(CREDENTIALS);

      await service.logout(first.refreshToken);

      expect(repo.sessionCount()).toBe(1);
      await expect(service.refresh(second.refreshToken)).resolves.toBeDefined();
    });
  });

  describe("getCurrentUser", () => {
    it("returns the user without the password", async () => {
      const created = await registerUser();

      const user = await service.getCurrentUser(created.id);

      expect(user).toEqual(created);
      expect(user).not.toHaveProperty("password");
    });

    it("returns undefined for an unknown id", async () => {
      await expect(service.getCurrentUser(9999)).resolves.toBeUndefined();
    });
  });

  describe("password handling", () => {
    it("hashes with a salt, so identical passwords differ per user", async () => {
      await registerUser();
      await service.register({ ...CREDENTIALS, email: "other@example.com" });

      const [first, second] = repo.users;
      expect(first!.password).not.toBe(second!.password);
    });

    it("compares the submitted password against the stored hash", async () => {
      await registerUser();

      const valid = await bcrypt.compare(
        CREDENTIALS.password,
        repo.users[0]!.password,
      );

      expect(valid).toBe(true);
    });
  });
});
