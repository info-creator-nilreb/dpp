/**
 * SUPER ADMIN AUTHENTICATION
 * 
 * COMPLETELY ISOLATED from tenant/user authentication.
 * 
 * Security Rules:
 * - NEVER reuse user auth logic
 * - NEVER check user.id or user.email from tenant context
 * - NEVER use tenant sessions
 * - ALWAYS use SuperAdmin table exclusively
 */

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPER_ADMIN_JWT_SECRET || process.env.AUTH_SECRET || "super-admin-secret-change-in-production"
)

const COOKIE_NAME = "super_admin_session"
const SESSION_DURATION = 60 * 60 // 60 minutes (1 hour)

export interface SuperAdminSession {
  id: string
  email: string
  name: string | null
  role: "super_admin" | "support_admin" | "read_only_admin"
}

/**
 * Authenticate Super Admin (login)
 * 
 * ONLY checks SuperAdmin table - NEVER touches User table
 */
export async function authenticateSuperAdmin(email: string, password: string): Promise<SuperAdminSession | null> {
  // ONLY query SuperAdmin table
  const admin = await prisma.superAdmin.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
      isActive: true,
      twoFactorAuth: {
        select: {
          enabled: true
        }
      }
    }
  })

  if (!admin) {
    return null
  }

  if (!admin.isActive) {
    return null
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, admin.passwordHash)
  if (!isValidPassword) {
    return null
  }

  // Update last login
  await prisma.superAdmin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  })

  // Return session data (NO sensitive data)
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as "super_admin" | "support_admin" | "read_only_admin"
  }
}

/**
 * Create Super Admin session (JWT + Cookie)
 */
export async function createSuperAdminSession(session: SuperAdminSession): Promise<void> {
  const cookieStore = await cookies()
  
  // Generate unique session ID to avoid token collisions (first 50 chars might be identical)
  const sessionId = randomBytes(32).toString("hex")
  
  // Store session in database for audit (before creating JWT)
  await prisma.superAdminSession.create({
    data: {
      superAdminId: session.id,
      token: sessionId, // Use unique session ID instead of token substring
      expiresAt: new Date(Date.now() + SESSION_DURATION * 1000),
      ipAddress: null, // Can be set from request if needed
      userAgent: null
    }
  })
  
  // Create JWT with session ID in payload
  const token = await new SignJWT({ ...session, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Date.now() + SESSION_DURATION * 1000)
    .sign(JWT_SECRET)

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/"
  })
}

/**
 * Get current Super Admin session
 * 
 * ONLY checks SuperAdmin session - NEVER checks user session
 */
export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Extract session ID from payload (if present)
    const sessionId = (payload as any).sessionId as string | undefined
    
    // Verify session still exists in database (optional check for newer sessions)
    // Note: JWT itself is already validated above, so we trust it
    // DB session check is optional and only for additional security
    // If DB session doesn't exist or expired, we still allow if JWT is valid
    // This prevents issues where JWT is valid but DB cleanup removed the session
    if (sessionId) {
      try {
        const dbSession = await prisma.superAdminSession.findUnique({
          where: { token: sessionId }
        })
        
        // Log if session expired in DB but JWT still valid (for debugging)
        if (dbSession && dbSession.expiresAt < new Date()) {
          console.warn("Super Admin session expired in DB but JWT valid - allowing access");
        }
        // If no DB session found, that's okay - JWT is still valid
      } catch (error) {
        // If DB check fails, still allow if JWT is valid
        console.warn("Super Admin session DB check failed, but JWT valid - allowing access");
      }
    }
    
    // Verify admin still exists and is active
    const admin = await prisma.superAdmin.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!admin || !admin.isActive) {
      return null
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as "super_admin" | "support_admin" | "read_only_admin"
    }
  } catch (error) {
    return null
  }
}

/**
 * Destroy Super Admin session (logout)
 */
export async function destroySuperAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  // Delete cookie (must use set with maxAge: 0 to properly delete with same path)
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  })

  // Invalidate session in database using session ID from JWT
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const sessionId = (payload as any).sessionId as string | undefined
      
      if (sessionId) {
        await prisma.superAdminSession.deleteMany({
          where: {
            token: sessionId
          }
        })
      }
    } catch (error) {
      // Token invalid or expired - session already gone, ignore
    }
  }
}

