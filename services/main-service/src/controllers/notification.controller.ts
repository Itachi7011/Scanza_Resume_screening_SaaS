import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { prisma } from "../config/database";

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { accountId: req.account!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { accountId: req.account!.id, isRead: false } });
  return sendSuccess(res, { notifications, unreadCount }, "Notifications fetched.");
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, accountId: req.account!.id },
    data: { isRead: true },
  });
  return sendSuccess(res, null, "Notification marked as read.");
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { accountId: req.account!.id, isRead: false },
    data: { isRead: true },
  });
  return sendSuccess(res, null, "All notifications marked as read.");
});
