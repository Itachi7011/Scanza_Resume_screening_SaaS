import type { PrismaClient as PrismaClientType } from "@prisma/client";

/**
 * Typed declaration for the plain-JS index.js in this package (see
 * index.js — it's CommonJS on purpose so both services can require() it
 * identically, but that means TypeScript needs this .d.ts alongside it to
 * type the import instead of falling back to `any`/erroring under strict mode).
 */
export declare const prisma: PrismaClientType;
export { PrismaClient } from "@prisma/client";