import { AuthRepository } from "./auth.repository.js";
import type { ApplicationRepository } from "../applications/application.repository.js";
import {
  generateAccessToken,
  generatePasswordResetToken,
  hashPasswordResetToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.js";
import bcrypt from "bcryptjs";
import {
  STARTER_APPLICATION,
  STARTER_NOTE,
} from "../../db/starter-application.js";
import {
  badCredentials,
  emailAlreadyRegistered,
  invalidCurrentPassword,
  invalidRefreshToken,
  invalidResetToken,
} from "../../utils/httpError.js";
import {
  buildPasswordResetUrl,
  sendPasswordResetEmail,
} from "../../utils/mailer.js";

function publicUser(user: { id: number; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private applicationRepository?: Pick<
      ApplicationRepository,
      "create" | "addNote"
    >,
  ) {}

  async register(input: { email: string; password: string; name: string }) {
    const existing = await this.authRepository.findUserByEmail(input.email);
    if (existing) {
      throw emailAlreadyRegistered();
    }

    const password = await bcrypt.hash(input.password, 10);
    const user = await this.authRepository.createUser({ ...input, password });
    if (!user) {
      throw new Error("Failed to create user");
    }

    await this.seedStarterApplication(user.id);

    return publicUser(user);
  }

  // Both tokens travel in httpOnly cookies (set by the controller), never in
  // the JSON body, so JavaScript cannot read them. The refresh token is a
  // self-contained signed JWT: no session row is created.
  async login(input: { email: string; password: string }) {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      throw badCredentials();
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw badCredentials();
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id, user.tokenVersion);

    return {
      accessToken,
      refreshToken,
      user: publicUser(user),
    };
  }

  async refresh(refreshToken: string) {
    let payload: { userId: number; tokenVersion: number };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw invalidRefreshToken();
    }

    const user = await this.authRepository.findUserById(payload.userId);
    // Unknown user, or the version moved on (password change/reset retired
    // this token): either way it no longer refreshes.
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw invalidRefreshToken();
    }

    // Sliding lifetime: every refresh mints a fresh pair with a new jti.
    return {
      accessToken: generateAccessToken(user.id),
      refreshToken: signRefreshToken(user.id, user.tokenVersion),
      user: publicUser(user),
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.authRepository.findUserById(userId);
    return user ? publicUser(user) : undefined;
  }

  async changePassword(
    userId: number,
    input: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw badCredentials();
    }

    const valid = await bcrypt.compare(input.currentPassword, user.password);
    if (!valid) {
      throw invalidCurrentPassword();
    }

    const password = await bcrypt.hash(input.newPassword, 10);
    await this.authRepository.updateUserPassword(user.id, password);
    // A new password retires every outstanding refresh token, here and on
    // other devices. Access tokens live on for at most their 15 minutes.
    await this.authRepository.incrementTokenVersion(user.id);
  }

  /**
   * One example card in Applied so a fresh board is never blank. Best-effort:
   * the account already exists at this point, so a seed failure is logged
   * rather than failing signup.
   */
  private async seedStarterApplication(userId: number): Promise<void> {
    if (!this.applicationRepository) {
      return;
    }
    try {
      const card = await this.applicationRepository.create(userId, {
        ...STARTER_APPLICATION,
        appliedAt: new Date(),
      });
      await this.applicationRepository.addNote(userId, card.id, STARTER_NOTE);
    } catch (error) {
      console.error("failed to seed starter application", error);
    }
  }

  // Issues a reset link, or quietly does nothing when no account matches.
  async requestPasswordReset(input: { email: string }) {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      return;
    }

    // Retire any earlier link so a leaked older email cannot be replayed.
    await this.authRepository.deletePasswordResetTokensByUserId(user.id);

    const token = generatePasswordResetToken();
    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash: token.hash,
      expiresAt: token.expiresAt,
    });

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildPasswordResetUrl(token.raw),
    });
  }

  async resetPassword(input: { token: string; password: string }) {
    const tokenHash = hashPasswordResetToken(input.token);
    const stored =
      await this.authRepository.findPasswordResetTokenByHash(tokenHash);

    if (!stored) {
      throw invalidResetToken();
    }

    // An expired link is dropped on sight rather than left to accumulate.
    if (stored.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.deletePasswordResetTokenByHash(tokenHash);
      throw invalidResetToken();
    }

    const user = await this.authRepository.findUserById(stored.userId);
    if (!user) {
      await this.authRepository.deletePasswordResetTokenByHash(tokenHash);
      throw invalidResetToken();
    }

    const password = await bcrypt.hash(input.password, 10);
    await this.authRepository.updateUserPassword(user.id, password);

    // Burn the link and retire every refresh token: whoever prompted the
    // reset should be the only one left able to use the account.
    await this.authRepository.deletePasswordResetTokenByHash(tokenHash);
    await this.authRepository.incrementTokenVersion(user.id);
  }
}
