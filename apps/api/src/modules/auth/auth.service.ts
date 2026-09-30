import { AuthRepository } from "./auth.repository.js";
import {
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  hashPasswordResetToken,
  hashRefreshToken,
} from "../../utils/token.js";
import bcrypt from "bcrypt";
import {
  badCredentials,
  emailAlreadyRegistered,
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
  constructor(private authRepository: AuthRepository) {}

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

    return publicUser(user);
  }

  // access and raw refresh token are returned to the client, while the hashed refresh token in stored in db.
  // when the client wants to refresh the access token, they send the raw refresh token, which is hashed and compared to the stored hash in the db.
  // so that if the db is compromised, the attacker cannot use the hashed refresh token to get a new access token.

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
    const refresh = generateRefreshToken();
    await this.authRepository.createSession({
      userId: user.id,
      tokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
    });

    // Tokens are returned to the controller, which sets them as httpOnly
    // cookies. They are deliberately absent from the JSON body so they never
    // reach JavaScript or a token in localStorage.
    return {
      accessToken,
      refreshToken: refresh.raw,
      user: publicUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.authRepository.findSessionByTokenHash(tokenHash);
    if (!session) {
      throw invalidRefreshToken();
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.deleteSessionByTokenHash(tokenHash);
      throw invalidRefreshToken();
    }

    const user = await this.authRepository.findUserById(session.userId);
    if (!user) {
      await this.authRepository.deleteSessionByTokenHash(tokenHash);
      throw invalidRefreshToken();
    }

    await this.authRepository.deleteSessionByTokenHash(tokenHash);

    const accessToken = generateAccessToken(user.id);
    const next = generateRefreshToken();
    await this.authRepository.createSession({
      userId: user.id,
      tokenHash: next.hash,
      expiresAt: next.expiresAt,
    });

    return {
      accessToken,
      refreshToken: next.raw,
      user: publicUser(user),
    };
  }

  async logout(refreshToken: string) {
    await this.authRepository.deleteSessionByTokenHash(
      hashRefreshToken(refreshToken),
    );
  }

  async getCurrentUser(userId: number) {
    const user = await this.authRepository.findUserById(userId);
    return user ? publicUser(user) : undefined;
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

    // Burn the link and end every existing session: whoever prompted the reset
    // should be the only one left able to use the account.
    await this.authRepository.deletePasswordResetTokenByHash(tokenHash);
    await this.authRepository.deleteSessionsByUserId(user.id);
  }
}
