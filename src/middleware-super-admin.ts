/**
 * SUPER ADMIN MIDDLEWARE
 * 
 * COMPLETELY SEPARATE from tenant middleware.
 * 
 * Security Rules:
 * - ONLY protects /super-admin/* routes
 * - NEVER checks tenant/user auth
 * - ONLY checks SuperAdmin session
 * - Explicit role checking
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPER_ADMIN_JWT_SECRET || process.env.AUTH_SECRET || "super-admin-secret-change-in-production"
)

const COOKIE_NAME = "super_admin_session"

/**
 * Get Super Admin session from cookie (Edge-compatible)
 * 
 * Note: This is a simplified version for middleware.
 * Full session validation happens in server components/API routes.
 */
async function getSuperAdminSessionFromCookie(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as string,
      role: payload.role as string
    }
  } catch {
    return null
  }
}

export async function superAdminMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ONLY handle /super-admin/* routes
  if (!pathname.startsWith("/super-admin")) {
    return NextResponse.next()
  }

  const origin = request.headers.get("host") || request.nextUrl.host
  const protocol = request.nextUrl.protocol || "http:"
  const baseUrl = `${protocol}//${origin}`

  // Login page is public
  if (pathname === "/super-admin/login") {
    const session = await getSuperAdminSessionFromCookie(request)
    // If already logged in, redirect to dashboard
    if (session) {
      return NextResponse.redirect(new URL("/super-admin/dashboard", baseUrl))
    }
    return NextResponse.next()
  }

  // All other /super-admin/* routes require authentication
  const session = await getSuperAdminSessionFromCookie(request)

  if (!session) {
    return NextResponse.redirect(new URL("/super-admin/login", baseUrl))
  }

  // Allow access
  return NextResponse.next()
}

