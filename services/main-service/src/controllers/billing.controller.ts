import { Request, Response } from "express";
import { PlanTier } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/database";
import * as billingService from "../services/billing.service";

function requireClientId(req: Request): string {
  if (!req.account?.clientId) throw new AppError("This account is not associated with a SaaS client workspace.", 403);
  return req.account.clientId;
}

export const getBillingInfo = asyncHandler(async (req: Request, res: Response) => {
  const info = await billingService.getBillingInfo(requireClientId(req));
  return sendSuccess(res, info, "Billing info fetched.");
});

export const startCheckout = asyncHandler(async (req: Request, res: Response) => {
  const clientId = requireClientId(req);
  const { targetPlan } = req.body as { targetPlan: PlanTier };

  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
  const result = await billingService.startCheckout(clientId, targetPlan, account.email);

  return sendSuccess(res, result, result.mode === "stripe" ? "Redirecting to checkout." : "Upgrade request received.");
});
