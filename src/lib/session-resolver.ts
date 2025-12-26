/**
 * CENTRAL SESSION RESOLVER
 * 
 * Single source of truth for session resolution.
 * Used by ALL API routes - no route should manually read tokens.
 */

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPER_ADMIN_JWT_SECRET || process.env.AUTH_SECRET || "super-admin-secret-change-in-production"
);

const SUPER_ADMIN_COOKIE_NAME = "super_admin_session";
const USER_COOKIE_NAME = "authjs.session-token"; // NextAuth default

export interface ResolvedSession {
  type: "super_admin" | "user";
  id: string;
  email: string;
  name: string | null;
  role: string;
  expiresAt?: Date;
}

/**
 * Central Session Resolver
 * 
 * Reads and validates session/JWT from cookies.
 * Returns user + role if valid, null if invalid or expired.
 * 
 * NO route should manually read tokens - use this function.
 */
export async function resolveSession(): Promise<ResolvedSession | null> {
  try {
    const cookieStore = await cookies();
    
    // Try Super Admin session first
    const superAdminToken = cookieStore.get(SUPER_ADMIN_COOKIE_NAME)?.value;
    if (superAdminToken) {
      try {
        const { payload } = await jwtVerify(superAdminToken, JWT_SECRET);
        
        // jwtVerify already rejects expired tokens, but let's be explicit
        // Check expiration from payload (in milliseconds)
        if (payload.exp) {
          const expirationTime = payload.exp * 1000; // Convert to milliseconds
          if (expirationTime < Date.now()) {
            console.log("[Session Resolver] Token expired:", {
              exp: new Date(expirationTime).toISOString(),
              now: new Date().toISOString(),
            });
            return null; // Token expired
          }
        }
        
        // Verify admin exists and is active
        const admin = await prisma.superAdmin.findUnique({
          where: { id: payload.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        });
        
        if (!admin || !admin.isActive) {
          return null;
        }
        
        const resolvedSession = {
          type: "super_admin" as const,
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
        };

        // DEBUG: Log resolved session (remove in production)
        console.log("[Session Resolver] Super Admin session resolved:", {
          email: resolvedSession.email,
          role: resolvedSession.role,
          expiresAt: resolvedSession.expiresAt?.toISOString(),
          expiresIn: resolvedSession.expiresAt
            ? Math.round((resolvedSession.expiresAt.getTime() - Date.now()) / 1000 / 60)
            : "never",
        });

        return resolvedSession;
      } catch (error) {
        // JWT invalid - try user session
      }
    }
    
    // Try User session (NextAuth)
    // Note: NextAuth sessions are handled differently
    // We'll use the auth() function from NextAuth for user sessions
    // This resolver focuses on Super Admin sessions
    
    return null;
  } catch (error) {
    console.error("Session resolver error:", error);
    return null;
  }
}

/**
 * Get session with debugging info (temporary - remove in production)
 */
export async function resolveSessionWithDebug(): Promise<{
  session: ResolvedSession | null;
  debug: {
    hasSuperAdminCookie: boolean;
    hasUserCookie: boolean;
    error?: string;
  };
}> {
  const cookieStore = await cookies();
  const superAdminToken = cookieStore.get(SUPER_ADMIN_COOKIE_NAME)?.value;
  const userToken = cookieStore.get(USER_COOKIE_NAME)?.value;
  
  const debug = {
    hasSuperAdminCookie: !!superAdminToken,
    hasUserCookie: !!userToken,
  };
  
  try {
    const session = await resolveSession();
    return { session, debug };
  } catch (error: any) {
    return {
      session: null,
      debug: {
        ...debug,
        error: error.message,
      },
    };
  }
}

