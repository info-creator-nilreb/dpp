import "next-auth"

/**
 * TypeScript-Typen für NextAuth.js
 * 
 * Erweitert die Standard-Typen um:
 * - User-ID in Session
 * - Platform-Admin-Flag
 * - User-Profil-Daten (firstName, lastName, role)
 * - User-ID in JWT Token
 */
declare module "next-auth" {
  interface User {
    id: string
    isPlatformAdmin?: boolean
    firstName?: string | null
    lastName?: string | null
    role?: string | null
  }

  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      isPlatformAdmin?: boolean
      firstName?: string | null
      lastName?: string | null
      role?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string // User-ID
    isPlatformAdmin?: boolean
    firstName?: string | null
    lastName?: string | null
    role?: string | null
  }
}

