import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { Account } from "@prisma/client";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Issues a fresh access + refresh token pair and persists the refresh
 * token's hash (never the raw token) so it can be revoked server-side
 * at any time — e.g. logout, password reset, or an admin blocking the user.
 */
export async function issueTokenPair(account: Account, meta: RequestMeta = {}) {
  const accessToken = signAccessToken({
    sub: account.id,
    role: account.role,
    clientId: account.clientId,
  });

  const jti = uuidv4();
  const refreshToken = signRefreshToken({ sub: account.id, jti });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      accountId: account.id,
      tokenHash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Rotates a refresh token: verifies it, checks it hasn't been revoked/used,
 * revokes it, and issues a brand new pair. Rotation (rather than reusing the
 * same refresh token forever) means a leaked token has a very short useful
 * window before it's naturally cycled out.
 */
export async function rotateRefreshToken(rawToken: string, meta: RequestMeta = {}) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new AppError("Invalid or expired session. Please log in again.", 401);
  }

  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError("Session expired. Please log in again.", 401);
  }

  const account = await prisma.account.findUnique({ where: { id: payload.sub } });
  if (!account || account.status === "BLOCKED" || account.status === "DELETED") {
    throw new AppError("This account is no longer active.", 403);
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  return issueTokenPair(account, meta);
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}

/** Used by admin "block user" and "force logout everywhere" actions. */
export async function revokeAllTokensForAccount(accountId: string) {
  await prisma.refreshToken.updateMany({
    where: { accountId, revoked: false },
    data: { revoked: true },
  });
}
