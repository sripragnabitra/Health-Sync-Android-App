import { PrismaClient } from "@prisma/client";
import { isProduction } from "../config/env";

/**
 * Singleton Prisma client. In dev, `tsx watch` hot-reloads this module on
 * every file save — without caching the instance on `globalThis`, each
 * reload would open a fresh pool of Postgres connections and eventually
 * exhaust the connection limit. This is the standard workaround.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["error", "warn", "query"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
