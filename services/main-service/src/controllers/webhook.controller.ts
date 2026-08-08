import { Request, Response } from "express";
import { env, isStripeConfigured } from "../config/env";
import { handleStripeWebhook } from "../services/billing.service";
import { logger } from "../utils/logger";

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!isStripeConfigured || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: "Stripe is not configured on this server." });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ success: false, message: "Missing Stripe signature." });
  }

  try {
    const result = await handleStripeWebhook(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
    return res.json(result);
  } catch (err) {
    logger.error("Stripe webhook verification failed", { error: (err as Error).message });
    return res.status(400).json({ success: false, message: "Webhook signature verification failed." });
  }
}
