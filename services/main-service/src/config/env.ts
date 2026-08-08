import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5002),

  DATABASE_URL: z.string().min(1),

  // MUST match auth-service's JWT_ACCESS_SECRET — both services verify the
  // same access tokens independently (stateless), no cross-service call needed.
  JWT_ACCESS_SECRET: z.string().min(32),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // Optional — the extractor gracefully falls back to RESUME_WORKER_URL when absent.
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),

  RESUME_WORKER_URL: z.string().url().default("http://localhost:8000"),

  MAX_UPLOAD_MB: z.coerce.number().default(10),

  // Optional — billing falls back to a manual "request received, admin will
  // follow up" flow when not configured, same philosophy as SendGrid/Claude.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_GROWTH_PRICE_ID: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default("noreply@scanza.dev"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables in main-service:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isClaudeConfigured = Boolean(env.ANTHROPIC_API_KEY);
export const isStripeConfigured = Boolean(env.STRIPE_SECRET_KEY);

if (!isStripeConfigured) {
  console.warn(
    "⚠️  STRIPE_SECRET_KEY not set — plan upgrade requests will be logged and flagged for manual admin follow-up instead of real checkout. This is expected in development."
  );
}

if (!isClaudeConfigured) {
  console.warn(
    "⚠️  ANTHROPIC_API_KEY not set — main-service will use the offline resume-worker " +
      "for all extractions instead of Claude. This is fully functional, just less accurate " +
      "on unusually formatted resumes. Set ANTHROPIC_API_KEY to upgrade at any time."
  );
}
