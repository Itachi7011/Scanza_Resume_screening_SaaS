import sgMail from "@sendgrid/mail";
import { env, isSendGridConfigured } from "../config/env";
import { logger } from "../utils/logger";

if (isSendGridConfigured) {
  sgMail.setApiKey(env.SENDGRID_API_KEY as string);
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Plaintext preview used ONLY for the console fallback, keep it short. */
  consolePreview: string;
}

/**
 * Central email sender. If SendGrid isn't configured (no subscription yet),
 * we DO NOT throw or block the request — we log the content to the console
 * so development can continue uninterrupted, exactly as requested. Once
 * SENDGRID_API_KEY is set in .env, this function automatically starts
 * sending real emails with zero code changes required.
 */
export async function sendEmail({ to, subject, html, consolePreview }: SendEmailParams) {
  if (!isSendGridConfigured) {
    logger.warn(`✉️  [DEV FALLBACK] Email NOT sent (no SendGrid key). Would have sent to ${to}`);
    console.log(
      `\n┌───────────────── DEV EMAIL FALLBACK ─────────────────┐\n` +
        `│ To:      ${to}\n` +
        `│ Subject: ${subject}\n` +
        `│ ${consolePreview}\n` +
        `└────────────────────────────────────────────────────┘\n`
    );
    return { delivered: false, viaFallback: true };
  }

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL,
      subject,
      html,
    });
    return { delivered: true, viaFallback: false };
  } catch (err) {
    // Even if SendGrid errors out (e.g. expired plan), don't break the user's flow.
    logger.error("SendGrid send failed — falling back to console log", { error: (err as Error).message });
    console.log(
      `\n┌───────────────── DEV EMAIL FALLBACK (SendGrid errored) ─────────────────┐\n` +
        `│ To:      ${to}\n` +
        `│ Subject: ${subject}\n` +
        `│ ${consolePreview}\n` +
        `└──────────────────────────────────────────────────────────────────────┘\n`
    );
    return { delivered: false, viaFallback: true };
  }
}

export function otpEmailTemplate(code: string, purpose: string) {
  return {
    subject: `Your Scanza verification code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#4F46E5;">Scanza</h2>
        <p>Your verification code for <strong>${purpose}</strong> is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${code}</p>
        <p style="color:#666;">This code expires in ${env.OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
    consolePreview: `OTP CODE: ${code}  (purpose: ${purpose}, expires in ${env.OTP_EXPIRY_MINUTES}m)`,
  };
}
