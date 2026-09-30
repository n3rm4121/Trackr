import nodemailer from "nodemailer";
import config from "../config/config.js";

export function buildPasswordResetUrl(rawToken: string): string {
  return `${config.appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

// in dev: link will be logged to the console rather than emailed
export async function sendPasswordResetEmail(args: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  if (!config.isProduction) {
    console.log(
      [
        "",
        "── password reset (development: email not sent) ──",
        `to:      ${args.to}`,
        `link:    ${args.resetUrl}`,
        `expires: ${config.passwordResetTokenTtlMs / 60_000} minutes`,
        "───────────────────────────────────────────────────",
      ].join("\n"),
    );
    return;
  }

  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    ...(config.smtp.user && config.smtp.password
      ? {
          auth: {
            user: config.smtp.user,
            pass: config.smtp.password,
          },
        }
      : {}),
  });

  await transport.sendMail({
    from: config.smtp.from,
    to: args.to,
    subject: "Reset your Job Kanban password",
    text: [
      `Hi ${args.name},`,
      "",
      "Use the link below to choose a new password. It expires shortly, and can",
      "only be used once.",
      "",
      args.resetUrl,
      "",
      "If you did not ask for this, you can ignore this email.",
    ].join("\n"),
  });
}
