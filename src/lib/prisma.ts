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
  // In development: Check if new fields are available, if not, force re-initialization
  if (process.env.NODE_ENV === "development" && globalForPrisma.prisma) {
    try {
      // Check if new fields are available by testing the model
      const testModel = (globalForPrisma.prisma as any).featureRegistry
      if (testModel) {
        // Try to access a method that would use the new field
        // If the client is stale, this will fail gracefully
        const hasSystemDefined = 'systemDefined' in (testModel as any) || 
          typeof (testModel as any).findFirst === 'function'
        
        // If systemDefined field is expected but not found, force re-init
        // This is a heuristic check - if the schema was updated, we should re-init
        if (!hasSystemDefined) {
          console.log('[PRISMA] Detected schema changes, re-initializing client...')
          globalForPrisma.prisma.$disconnect().catch(() => {})
          globalForPrisma.prisma = undefined as any
        }
      }
    } catch (e) {
      // If check fails, force re-initialization to be safe
      console.log('[PRISMA] Error checking client, re-initializing...')
      try {
        globalForPrisma.prisma.$disconnect().catch(() => {})
      } catch {}
      globalForPrisma.prisma = undefined as any
    }
  }
  
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

  // Always cache in global scope (works in both development and Vercel serverless)
  // Vercel serverless functions share the global scope between invocations
  globalForPrisma.prisma = prisma

  return prisma
}

// Exportiere eine Proxy, die lazy loading ermöglicht
// TypeScript wird den Typ korrekt inferieren durch 'as PrismaClient'
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const prismaInstance = getPrisma()
    
    // Direkter Zugriff auf die Property (nicht über Reflect.get, da das bei Proxies Probleme machen kann)
    const value = (prismaInstance as any)[prop]
    
    // Wenn es undefined ist und es sich nicht um spezielle Properties handelt
    if (value === undefined && prop !== 'then' && prop !== 'constructor' && prop !== Symbol.toStringTag && prop !== '$$typeof') {
      // Prüfe ob die Property existiert
      if (!(prop in prismaInstance)) {
        console.warn(`[PRISMA] Property '${String(prop)}' not found. Available keys:`, Object.keys(prismaInstance).slice(0, 20))
        return undefined
      }
    }
    
    // Wenn es eine Funktion ist, binde 'this' korrekt
    if (typeof value === "function") {
      return value.bind(prismaInstance)
    }
    
    // Wenn es ein Objekt ist (z.B. pricingPlan), gib es direkt zurück
    // Die Methoden sind bereits korrekt gebunden
    if (value && typeof value === "object" && !Array.isArray(value) && value !== null) {
      return value
    }
    
    return value
  },
  has(_target, prop) {
    const prismaInstance = getPrisma()
    return prop in prismaInstance
  },
  ownKeys(_target) {
    const prismaInstance = getPrisma()
    return Object.keys(prismaInstance)
  },
  getOwnPropertyDescriptor(_target, prop) {
    const prismaInstance = getPrisma()
    const descriptor = Object.getOwnPropertyDescriptor(prismaInstance, prop)
    if (descriptor) {
      return descriptor
    }
    // Fallback: Wenn Property nicht direkt existiert, aber im Prototype
    if (prop in prismaInstance) {
      return {
        enumerable: true,
        configurable: true,
        writable: true
      }
    }
    return undefined
  }
}) as PrismaClient

