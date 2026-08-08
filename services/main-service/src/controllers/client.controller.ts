import crypto from "crypto";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/database";
import { notify } from "../services/notification.service";
import { NotificationType } from "@prisma/client";

function requireClientId(req: Request): string {
  if (!req.account?.clientId) throw new AppError("This account is not associated with a SaaS client workspace.", 403);
  return req.account.clientId;
}

export const getClientProfile = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: requireClientId(req) },
    include: { apiKeys: { select: { id: true, label: true, keyPrefix: true, isActive: true, lastUsedAt: true, requestCount: true, createdAt: true } } },
  });
  return sendSuccess(res, client, "Client profile fetched.");
});

export const updateClientSettings = asyncHandler(async (req: Request, res: Response) => {
  const clientId = requireClientId(req);
  const { companyName, websiteUrl, webhookUrl, allowedOrigins } = req.body;

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      companyName,
      websiteUrl,
      webhookUrl: webhookUrl === "" ? null : webhookUrl,
      allowedOrigins,
    },
  });

  return sendSuccess(res, client, "Settings updated.");
});

export const createApiKey = asyncHandler(async (req: Request, res: Response) => {
  const clientId = requireClientId(req);
  const { label } = req.body;

  const rawKey = `scz_live_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: { clientId, label, keyPrefix: rawKey.slice(0, 14), keyHash },
  });

  await notify({
    accountId: req.account!.id,
    type: NotificationType.API_KEY_CREATED,
    title: "New API key created",
    message: `A new API key "${label}" was created for your workspace.`,
  });

  // The raw key is returned ONLY here, once — Scanza itself never stores or
  // can display it again after this response, same as Stripe/GitHub do.
  return sendSuccess(res, { ...apiKey, rawKey }, "API key created. Copy it now — it won't be shown again.", 201);
});

export const revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
  const clientId = requireClientId(req);
  const apiKey = await prisma.apiKey.findUnique({ where: { id: req.params.id } });

  if (!apiKey || apiKey.clientId !== clientId) throw new AppError("API key not found.", 404);

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { isActive: false, revokedAt: new Date() },
  });

  await notify({
    accountId: req.account!.id,
    type: NotificationType.API_KEY_REVOKED,
    title: "API key revoked",
    message: `The API key "${apiKey.label}" has been revoked.`,
  });

  return sendSuccess(res, null, "API key revoked.");
});

export const getUsageStats = asyncHandler(async (req: Request, res: Response) => {
  const clientId = requireClientId(req);
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  const [totalResumes, last30Days] = await Promise.all([
    prisma.resume.count({ where: { clientId } }),
    prisma.resume.count({ where: { clientId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
  ]);

  return sendSuccess(res, {
    planTier: client.planTier,
    monthlyQuota: client.monthlyQuota,
    usedThisCycle: client.usedThisCycle,
    remainingThisCycle: Math.max(0, client.monthlyQuota - client.usedThisCycle),
    totalResumesAllTime: totalResumes,
    resumesLast30Days: last30Days,
  }, "Usage stats fetched.");
});
