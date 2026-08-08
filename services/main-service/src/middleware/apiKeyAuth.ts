import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { sendError } from "../utils/apiResponse";

/**
 * Protects every endpoint under /api/app/v1/* — the public SaaS surface
 * that client companies call from their own backend (or browser widget)
 * using the API key issued from their Scanza dashboard.
 *
 * Header: X-API-Key: scz_live_xxxxxxxxxxxx
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const rawKey = req.header("X-API-Key");
  if (!rawKey) return sendError(res, "Missing X-API-Key header.", 401);

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { client: true },
  });

  if (!apiKey || !apiKey.isActive) {
    return sendError(res, "Invalid or revoked API key.", 401);
  }
  if (apiKey.client.isSuspended) {
    return sendError(res, "This account has been suspended. Contact Scanza support.", 403);
  }

  // Origin allow-list check — only enforced when the client has configured
  // one (widget embeds) and only for browser-originated requests.
  const origin = req.header("Origin");
  if (origin && apiKey.client.allowedOrigins.length > 0 && !apiKey.client.allowedOrigins.includes(origin)) {
    return sendError(res, "This origin is not authorized for this API key.", 403);
  }

  if (apiKey.client.usedThisCycle >= apiKey.client.monthlyQuota) {
    return sendError(res, "Monthly resume-processing quota exceeded. Please upgrade your plan.", 429);
  }

  // Fire-and-forget usage tracking — doesn't block the request.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date(), requestCount: { increment: 1 } } })
    .catch(() => void 0);

  req.apiClient = { clientId: apiKey.clientId, apiKeyId: apiKey.id };
  next();
}
