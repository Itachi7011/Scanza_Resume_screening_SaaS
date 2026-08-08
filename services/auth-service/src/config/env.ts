import "dotenv/config";
import { z } from "zod";

/**
 * Validates process.env at boot. If something critical is missing, we fail
 * fast with a clear message instead of crashing mysteriously later.
 * Non-critical integrations (SendGrid) are intentionally optional — see
 * services/email.service.ts for the console-log fallback behavior.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5001),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().default(30),

  COOKIE_DOMAIN: z.string().default("localhost"),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Optional — falls back to console-logging OTPs/emails when absent.
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default("noreply@scanza.dev"),

  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),

  SEED_ADMIN_EMAIL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables in auth-service:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const isSendGridConfigured = Boolean(env.SENDGRID_API_KEY);

if (!isSendGridConfigured) {
  console.warn(
    "⚠️  SENDGRID_API_KEY not set — auth-service will print OTPs/emails to the console instead of sending them. This is expected in development."
  );
}
