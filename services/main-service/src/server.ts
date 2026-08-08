import http from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./config/database";
import { initSocketServer } from "./sockets/socket";

const httpServer = http.createServer(app);
initSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`🚀 main-service listening on port ${env.PORT} [${env.NODE_ENV}] (Socket.IO attached)`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
