/**
 * Shared Prisma client singleton.
 * Both auth-service and main-service import this instead of creating
 * their own PrismaClient, so they share one connection pool config
 * and one source of truth for the schema.
 *
 * Usage: const { prisma } = require("@scanza/database");
 */
const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__scanzaPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__scanzaPrisma = prisma;
}

module.exports = { prisma, PrismaClient };
