import sgMail from "@sendgrid/mail";
import { logger } from "../utils/logger";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@scanza.dev";
const isSendGridConfigured = Boolean(SENDGRID_API_KEY);

if (isSendGridConfigured) {
  sgMail.setApiKey(SENDGRID_API_KEY as string);
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  consolePreview: string;
}

/** Same fallback philosophy as auth-service's email service: if SendGrid
 * isn't configured, print to console instead of failing the request. */
export async function sendEmail({ to, subject, html, consolePreview }: SendEmailParams) {
  if (!isSendGridConfigured) {
    console.log(
      `\n┌───────────────── DEV EMAIL FALLBACK (main-service) ─────────────────┐\n` +
        `│ To:      ${to}\n│ Subject: ${subject}\n│ ${consolePreview}\n` +
        `└───────────────────────────────────────────────────────────────────┘\n`
    );
    return { delivered: false };
  }
  try {
    await sgMail.send({ to, from: SENDGRID_FROM_EMAIL, subject, html });
    return { delivered: true };
  } catch (err) {
    logger.error("SendGrid send failed", { error: (err as Error).message });
    console.log(`[DEV EMAIL FALLBACK] To: ${to} | ${consolePreview}`);
    return { delivered: false };
  }
}

export function teamInviteEmailTemplate(companyName: string, inviteUrl: string) {
  return {
    subject: `You've been invited to join ${companyName} on Scanza`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#4F46E5;">Scanza</h2>
      <p>You've been invited to join <strong>${companyName}</strong>'s workspace on Scanza.</p>
      <p><a href="${inviteUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Accept Invitation</a></p>
      <p style="color:#666;font-size:12px;">This invite expires in 7 days.</p>
    </div>`,
    consolePreview: `INVITE LINK: ${inviteUrl}`,
  };
}
