import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Lazy-loaded Prisma Client
 * 
 * Wird erst beim ersten Aufruf initialisiert, nicht beim Import.
 * Dies verhindert Prisma-Initialisierung zur Build-Zeit.
 */
function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
  }

  return prisma
}

// Exportiere eine Proxy, die lazy loading ermöglicht
// TypeScript wird den Typ korrekt inferieren durch 'as PrismaClient'
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const prismaInstance = getPrisma()
    const value = prismaInstance[prop as keyof PrismaClient]
    // Wenn es eine Funktion ist, binde 'this' korrekt
    if (typeof value === "function") {
      return value.bind(prismaInstance)
    }
    return value
  },
  has(_target, prop) {
    const prismaInstance = getPrisma()
    return prop in prismaInstance
  },
  ownKeys(_target) {
    const prismaInstance = getPrisma()
    return Reflect.ownKeys(prismaInstance)
  },
  getOwnPropertyDescriptor(_target, prop) {
    const prismaInstance = getPrisma()
    return Reflect.getOwnPropertyDescriptor(prismaInstance, prop)
  }
}) as PrismaClient

