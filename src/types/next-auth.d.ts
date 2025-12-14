import "next-auth"

/**
 * TypeScript-Typen für NextAuth.js
 * 
 * Erweitert die Standard-Typen um:
 * - User-ID in Session
 * - Platform-Admin-Flag
 * - User-ID in JWT Token
 */
declare module "next-auth" {
  interface User {
    id: string
    isPlatformAdmin?: boolean
  }

  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      isPlatformAdmin?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string // User-ID
    isPlatformAdmin?: boolean
  }
}

