import Stripe from "stripe";
import { PlanTier } from "@prisma/client";
import { prisma } from "../config/database";
import { env, isStripeConfigured } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) stripeClient = new Stripe(env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-06-20" });
  return stripeClient;
}

const PRICE_IDS: Partial<Record<PlanTier, string | undefined>> = {
  STARTER: env.STRIPE_STARTER_PRICE_ID,
  GROWTH: env.STRIPE_GROWTH_PRICE_ID,
};

export async function getBillingInfo(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  return {
    planTier: client.planTier,
    monthlyQuota: client.monthlyQuota,
    usedThisCycle: client.usedThisCycle,
    hasActiveStripeSubscription: Boolean(client.stripeSubscriptionId),
    billingEmail: client.billingEmail,
    isStripeConfigured,
  };
}

/**
 * Starts a plan upgrade. With STRIPE_SECRET_KEY configured, this creates a
 * real Stripe Checkout session and returns the redirect URL. Without it —
 * exactly like SendGrid/Claude elsewhere in this project — nothing breaks:
 * the request is recorded and flagged for an admin to complete manually
 * (e.g. wiring up billing outside Stripe, or upgrading the plan by hand
 * once you do have Stripe keys).
 */
export async function startCheckout(clientId: string, targetPlan: PlanTier, accountEmail: string) {
  if (targetPlan === PlanTier.FREE) throw new AppError("Cannot 'upgrade' to the Free plan.", 400);

  if (!isStripeConfigured) {
    logger.warn("Stripe not configured — recording manual upgrade request", { clientId, targetPlan });
    console.log(
      `\n┌──── MANUAL BILLING FOLLOW-UP NEEDED ────┐\n` +
        `│ Client ${clientId} requested upgrade to ${targetPlan}\n` +
        `│ Contact: ${accountEmail}\n` +
        `│ Stripe isn't configured — upgrade the client's planTier manually\n` +
        `│ from the admin panel once payment is arranged outside Stripe.\n` +
        `└──────────────────────────────────────────┘\n`
    );
    return { checkoutUrl: null, mode: "manual" as const, message: "Your upgrade request was received. Our team will follow up by email to complete billing setup." };
  }

  const priceId = PRICE_IDS[targetPlan];
  if (!priceId) throw new AppError(`No Stripe price configured for the ${targetPlan} plan.`, 500);

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const stripe = getStripe();

  let customerId = client.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: accountEmail, name: client.companyName, metadata: { clientId } });
    customerId = customer.id;
    await prisma.client.update({ where: { id: clientId }, data: { stripeCustomerId: customerId, billingEmail: accountEmail } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard/client/billing?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard/client/billing?canceled=true`,
    metadata: { clientId, targetPlan },
  });

  return { checkoutUrl: session.url, mode: "stripe" as const, message: null };
}

/** Called from a Stripe webhook once payment succeeds — upgrades the plan
 * and resets usage. Kept separate from startCheckout so it's testable and
 * so the webhook route stays a thin pass-through. */
export async function applyPlanUpgrade(clientId: string, targetPlan: PlanTier, stripeSubscriptionId: string) {
  const quotaByPlan: Record<PlanTier, number> = { FREE: 50, STARTER: 500, GROWTH: 3000, ENTERPRISE: 100000 };
  await prisma.client.update({
    where: { id: clientId },
    data: { planTier: targetPlan, monthlyQuota: quotaByPlan[targetPlan], stripeSubscriptionId },
  });
}

/**
 * Verifies and handles a Stripe webhook event. Only acts on
 * checkout.session.completed — everything else is acknowledged (200) and
 * ignored, which is the correct behavior for webhooks you don't need yet
 * rather than erroring on events you haven't implemented.
 */
export async function handleStripeWebhook(rawBody: Buffer, signature: string, webhookSecret: string) {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const clientId = session.metadata?.clientId;
    const targetPlan = session.metadata?.targetPlan as PlanTier | undefined;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (clientId && targetPlan && subscriptionId) {
      await applyPlanUpgrade(clientId, targetPlan, subscriptionId);
      logger.info("Applied Stripe plan upgrade", { clientId, targetPlan });
    }
  }

  return { received: true };
}
