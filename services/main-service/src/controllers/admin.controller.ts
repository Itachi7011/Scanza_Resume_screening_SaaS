import { Request, Response } from "express";
import { AccountRole, AccountStatus, AuditAction } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/database";
import { resolveDateRange, bucketByDay } from "../utils/dateRange";
import { notify, notifyAdmins } from "../services/notification.service";
import { NotificationType } from "@prisma/client";

// ---------------------------------------------------------------------
// Dashboard / analytics
// ---------------------------------------------------------------------
export const getDashboardOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalClients, totalResumes, activeApiKeys, blockedUsers] = await Promise.all([
    prisma.account.count({ where: { role: { in: [AccountRole.END_USER, AccountRole.CLIENT_OWNER, AccountRole.CLIENT_MEMBER] } } }),
    prisma.client.count(),
    prisma.resume.count(),
    prisma.apiKey.count({ where: { isActive: true } }),
    prisma.account.count({ where: { status: AccountStatus.BLOCKED } }),
  ]);

  return sendSuccess(res, { totalUsers, totalClients, totalResumes, activeApiKeys, blockedUsers }, "Overview fetched.");
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = resolveDateRange(req.query as never);

  const [resumes, signups, scoreResults] = await Promise.all([
    prisma.resume.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { createdAt: true, extractionEngine: true, source: true } }),
    prisma.account.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { createdAt: true, role: true } }),
    prisma.scoreResult.findMany({ where: { computedAt: { gte: from, lte: to } }, select: { overallScore: true } }),
  ]);

  const resumesPerDay = bucketByDay(resumes, from, to);
  const signupsPerDay = bucketByDay(signups, from, to);

  const engineSplit = resumes.reduce<Record<string, number>>((acc, r) => {
    const key = r.extractionEngine ?? "PENDING";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const sourceSplit = resumes.reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = (acc[r.source] ?? 0) + 1;
    return acc;
  }, {});

  const scoreDistribution = { "0-40": 0, "41-60": 0, "61-75": 0, "76-90": 0, "91-100": 0 };
  for (const s of scoreResults) {
    if (s.overallScore <= 40) scoreDistribution["0-40"]++;
    else if (s.overallScore <= 60) scoreDistribution["41-60"]++;
    else if (s.overallScore <= 75) scoreDistribution["61-75"]++;
    else if (s.overallScore <= 90) scoreDistribution["76-90"]++;
    else scoreDistribution["91-100"]++;
  }

  const topSkills = await prisma.resumeSkill.groupBy({
    by: ["skillId"],
    _count: { skillId: true },
    orderBy: { _count: { skillId: "desc" } },
    take: 10,
  });
  const topSkillDetails = await prisma.skill.findMany({ where: { id: { in: topSkills.map((s) => s.skillId) } } });
  const topSkillsWithNames = topSkills.map((ts) => ({
    name: topSkillDetails.find((d) => d.id === ts.skillId)?.name ?? "Unknown",
    count: ts._count.skillId,
  }));

  return sendSuccess(res, {
    range: { from, to },
    resumesPerDay,
    signupsPerDay,
    engineSplit,
    sourceSplit,
    scoreDistribution,
    topSkills: topSkillsWithNames,
    averageScore: scoreResults.length ? Math.round(scoreResults.reduce((s, r) => s + r.overallScore, 0) / scoreResults.length) : null,
  }, "Analytics fetched.");
});

// ---------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search, role, status } = req.query as unknown as {
    page: number; pageSize: number; search?: string; role?: string; status?: string;
  };

  const where = {
    ...(search ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { fullName: { contains: search, mode: "insensitive" as const } }] } : {}),
    ...(role ? { role: role as AccountRole } : {}),
    ...(status ? { status: status as AccountStatus } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, fullName: true, email: true, role: true, status: true, isEmailVerified: true, createdAt: true, lastLoginAt: true, clientId: true },
    }),
    prisma.account.count({ where }),
  ]);

  return sendSuccess(res, { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }, "Users fetched.");
});

async function writeAuditLog(actorId: string, action: AuditAction, targetType: string, targetId: string, req: Request, details?: object) {
  await prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, details, ipAddress: req.ip },
  });
}

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const target = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError("User not found.", 404);
  if (target.role === AccountRole.SUPER_ADMIN) throw new AppError("Super admin accounts cannot be blocked.", 403);

  await prisma.account.update({ where: { id: target.id }, data: { status: AccountStatus.BLOCKED } });
  // Force logout everywhere — revoke every active refresh token immediately.
  await prisma.refreshToken.updateMany({ where: { accountId: target.id, revoked: false }, data: { revoked: true } });

  await writeAuditLog(req.account!.id, AuditAction.USER_BLOCKED, "Account", target.id, req);
  await notify({ accountId: target.id, type: NotificationType.ACCOUNT_BLOCKED, title: "Account blocked", message: "Your account has been blocked by an administrator." });

  return sendSuccess(res, null, "User blocked.");
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const target = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError("User not found.", 404);

  await prisma.account.update({ where: { id: target.id }, data: { status: AccountStatus.ACTIVE } });
  await writeAuditLog(req.account!.id, AuditAction.USER_UNBLOCKED, "Account", target.id, req);
  await notify({ accountId: target.id, type: NotificationType.ACCOUNT_UNBLOCKED, title: "Account restored", message: "Your account has been unblocked. You can log in again." });

  return sendSuccess(res, null, "User unblocked.");
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const target = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError("User not found.", 404);
  if (target.role === AccountRole.SUPER_ADMIN) throw new AppError("Cannot change a super admin's role.", 403);

  const updated = await prisma.account.update({ where: { id: target.id }, data: { role: req.body.role } });
  await writeAuditLog(req.account!.id, AuditAction.USER_ROLE_CHANGED, "Account", target.id, req, { from: target.role, to: req.body.role });

  return sendSuccess(res, updated, "Role updated.");
});

// ---------------------------------------------------------------------
// Client (SaaS customer) management
// ---------------------------------------------------------------------
export const listClients = asyncHandler(async (_req: Request, res: Response) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { apiKeys: true, resumes: true, accounts: true } } },
  });
  return sendSuccess(res, clients, "Clients fetched.");
});

export const suspendClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.update({ where: { id: req.params.id }, data: { isSuspended: true } });
  await writeAuditLog(req.account!.id, AuditAction.CLIENT_SUSPENDED, "Client", client.id, req);
  return sendSuccess(res, client, "Client suspended.");
});

export const reactivateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.update({ where: { id: req.params.id }, data: { isSuspended: false } });
  await writeAuditLog(req.account!.id, AuditAction.CLIENT_REACTIVATED, "Client", client.id, req);
  return sendSuccess(res, client, "Client reactivated.");
});

// ---------------------------------------------------------------------
// Audit logs + platform settings
// ---------------------------------------------------------------------
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 30 } = req.query as unknown as { page?: number; pageSize?: number };
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
    include: { actor: { select: { fullName: true, email: true } } },
  });
  return sendSuccess(res, logs, "Audit logs fetched.");
});

export const getPlatformSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.platformSetting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
  return sendSuccess(res, settings, "Settings fetched.");
});

export const updatePlatformSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await prisma.platformSetting.update({ where: { id: "singleton" }, data: req.body });
  await writeAuditLog(req.account!.id, AuditAction.SETTINGS_CHANGED, "PlatformSetting", "singleton", req, req.body);

  if (req.body.announcementBanner) {
    await notifyAdmins("admin:settings-changed", settings);
  }

  return sendSuccess(res, settings, "Settings updated.");
});
