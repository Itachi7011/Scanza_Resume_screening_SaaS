import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { AccountRole } from "@prisma/client";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let io: SocketIOServer | null = null;

interface AccessTokenPayload {
  sub: string;
  role: AccountRole;
}

/**
 * Every connected socket joins a room named after its accountId. Emitting
 * a notification anywhere in the app is then just:
 *   getIO().to(accountId).emit("notification:new", payload)
 * Admins additionally join an "admins" room so broadcast-to-all-admins
 * (e.g. "new resume processed" live counters on the analytics dashboard)
 * is a single emit rather than N individual ones.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: "scanza-auth-service",
      }) as AccessTokenPayload;
      socket.data.accountId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { accountId, role } = socket.data;
    socket.join(accountId);
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      socket.join("admins");
    }
    logger.info(`Socket connected: account=${accountId} role=${role}`);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: account=${accountId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO server not initialized yet.");
  return io;
}
