/**
 * PASSWORD PROTECTION - EDGE RUNTIME COMPATIBLE
 * 
 * Edge Runtime compatible version (no Prisma, only cookies)
 * Used in middleware.ts
 */

import { cookies } from "next/headers"

const ACCESS_COOKIE_NAME = "password_protection_access"
const SESSION_TIMEOUT_MINUTES = 60 // Default timeout

/**
 * Check if user has valid password protection access (Edge Runtime compatible)
 * Only checks cookie, no Prisma access
 */
export async function hasPasswordProtectionAccessEdge(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(ACCESS_COOKIE_NAME)

  if (!cookie?.value) {
    return false
  }

  try {
    const data = JSON.parse(cookie.value)
    
    if (!data.accessGranted || !data.lastActivityTimestamp) {
      return false
    }

    // Check if session has expired due to inactivity (use default timeout for Edge)
    const lastActivity = new Date(data.lastActivityTimestamp)
    const now = new Date()
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

    // Use default timeout in Edge Runtime (can't access Prisma config)
    if (minutesSinceActivity > SESSION_TIMEOUT_MINUTES) {
      // Session expired - delete cookie
      cookieStore.set(ACCESS_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
      return false
    }

    // Update last activity timestamp
    const updatedCookieValue = JSON.stringify({
      accessGranted: true,
      lastActivityTimestamp: now.toISOString(),
    })

    cookieStore.set(ACCESS_COOKIE_NAME, updatedCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      path: "/",
    })

    return true
  } catch {
    return false
  }
}

