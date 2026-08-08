import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { getIO } from "../sockets/socket";
import { logger } from "../utils/logger";

interface NotifyParams {
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

export async function notify({ accountId, type, title, message, metadata }: NotifyParams) {
  const notification = await prisma.notification.create({
    data: { accountId, type, title, message, metadata },
  });

  try {
    getIO().to(accountId).emit("notification:new", notification);
  } catch (err) {
    // Socket server may not be initialized in some contexts (e.g. scripts) —
    // the notification is still safely persisted either way.
    logger.warn("Could not emit realtime notification (socket server unavailable)", {
      error: (err as Error).message,
    });
  }

  return notification;
}

export async function notifyAdmins(event: string, payload: unknown) {
  try {
    getIO().to("admins").emit(event, payload);
  } catch (err) {
    logger.warn("Could not emit admin broadcast", { error: (err as Error).message });
  }
}
