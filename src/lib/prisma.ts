import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

// SQLite: Foreign Keys werden von Prisma automatisch aktiviert
// Keine manuelle Aktivierung nötig, da Prisma das beim ersten Query macht

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

