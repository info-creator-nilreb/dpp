/**
 * PASSWORD PROTECTION SYSTEM
 * 
 * Global password gate for Closed Alpha / Pre-Launch phase.
 * This is NOT authentication, NOT RBAC, and NOT subscription logic.
 * It is a temporary global pre-access barrier.
 */

import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const ACCESS_COOKIE_NAME = "password_protection_access"
const SESSION_TIMEOUT_MINUTES = 60

export interface PasswordProtectionConfig {
  passwordProtectionEnabled: boolean
  passwordProtectionStartDate: Date | null
  passwordProtectionEndDate: Date | null
  passwordProtectionPasswordHash: string | null
  passwordProtectionSessionTimeoutMinutes: number
}

/**
 * Get password protection configuration from database
 */
export async function getPasswordProtectionConfig(): Promise<PasswordProtectionConfig | null> {
  const config = await prisma.passwordProtectionConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  })

  if (!config) {
    return null
  }

  return {
    passwordProtectionEnabled: config.passwordProtectionEnabled,
    passwordProtectionStartDate: config.passwordProtectionStartDate,
    passwordProtectionEndDate: config.passwordProtectionEndDate,
    passwordProtectionPasswordHash: config.passwordProtectionPasswordHash,
    passwordProtectionSessionTimeoutMinutes: config.passwordProtectionSessionTimeoutMinutes,
  }
}

/**
 * Check if password protection is currently active
 */
export async function isPasswordProtectionActive(): Promise<boolean> {
  const config = await getPasswordProtectionConfig()

  if (!config) {
    return false
  }

  // Manual toggle overrides date logic
  if (config.passwordProtectionEnabled) {
    return true
  }

  // Check date range
  const now = new Date()
  if (config.passwordProtectionStartDate && config.passwordProtectionEndDate) {
    return now >= config.passwordProtectionStartDate && now <= config.passwordProtectionEndDate
  }

  if (config.passwordProtectionStartDate && !config.passwordProtectionEndDate) {
    return now >= config.passwordProtectionStartDate
  }

  if (!config.passwordProtectionStartDate && config.passwordProtectionEndDate) {
    return now <= config.passwordProtectionEndDate
  }

  return false
}

/**
 * Verify password against stored hash
 */
export async function verifyPasswordProtectionPassword(password: string): Promise<boolean> {
  const config = await getPasswordProtectionConfig()

  if (!config || !config.passwordProtectionPasswordHash) {
    return false
  }

  return bcrypt.compare(password, config.passwordProtectionPasswordHash)
}

/**
 * Set password protection access cookie
 */
export async function setPasswordProtectionAccessCookie(): Promise<void> {
  const cookieStore = await cookies()
  
  const now = new Date()
  const cookieValue = JSON.stringify({
    accessGranted: true,
    lastActivityTimestamp: now.toISOString(),
  })

  cookieStore.set(ACCESS_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TIMEOUT_MINUTES * 60, // 60 minutes in seconds
    path: "/",
  })
}

/**
 * Check if user has valid password protection access
 */
export async function hasPasswordProtectionAccess(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(ACCESS_COOKIE_NAME)

  if (!cookie?.value) {
    console.log("[hasPasswordProtectionAccess] No cookie found")
    return false
  }

  try {
    const data = JSON.parse(cookie.value)
    
    if (!data.accessGranted || !data.lastActivityTimestamp) {
      console.log("[hasPasswordProtectionAccess] Cookie data invalid:", { hasAccessGranted: !!data.accessGranted, hasTimestamp: !!data.lastActivityTimestamp })
      return false
    }

    // Check if session has expired due to inactivity
    const lastActivity = new Date(data.lastActivityTimestamp)
    const now = new Date()
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

    const config = await getPasswordProtectionConfig()
    const timeoutMinutes = config?.passwordProtectionSessionTimeoutMinutes || SESSION_TIMEOUT_MINUTES

    if (minutesSinceActivity > timeoutMinutes) {
      // Session expired - delete cookie
      console.log("[hasPasswordProtectionAccess] Session expired:", minutesSinceActivity, "minutes")
      cookieStore.set(ACCESS_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
      return false
    }

    // DON'T update cookie here - it causes issues with Server Components
    // Cookie updates should only happen in API routes
    // The cookie is already valid, just return true

    console.log("[hasPasswordProtectionAccess] ✅ Access granted - minutes since activity:", minutesSinceActivity.toFixed(2))
    return true
  } catch (error) {
    console.log("[hasPasswordProtectionAccess] Error parsing cookie:", error)
    return false
  }
}

/**
 * Clear password protection access cookie
 */
export async function clearPasswordProtectionAccessCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

/**
 * Update password protection configuration
 */
export async function updatePasswordProtectionConfig(
  config: Partial<PasswordProtectionConfig>,
  updatedBy: string
): Promise<void> {
  // Get existing config or create new one
  const existing = await prisma.passwordProtectionConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  })

  // Hash password if provided
  let passwordHash = config.passwordProtectionPasswordHash || existing?.passwordProtectionPasswordHash || null
  if (config.passwordProtectionPasswordHash && config.passwordProtectionPasswordHash !== existing?.passwordProtectionPasswordHash) {
    // Only hash if it's a new password (not already hashed)
    // Simple check: if it's 60 chars, it's likely already hashed (bcrypt hash length)
    if (config.passwordProtectionPasswordHash.length !== 60) {
      passwordHash = await bcrypt.hash(config.passwordProtectionPasswordHash, 10)
    } else {
      passwordHash = config.passwordProtectionPasswordHash
    }
  }

  if (existing) {
    await prisma.passwordProtectionConfig.update({
      where: { id: existing.id },
      data: {
        passwordProtectionEnabled: config.passwordProtectionEnabled ?? existing.passwordProtectionEnabled,
        passwordProtectionStartDate: config.passwordProtectionStartDate ?? existing.passwordProtectionStartDate,
        passwordProtectionEndDate: config.passwordProtectionEndDate ?? existing.passwordProtectionEndDate,
        passwordProtectionPasswordHash: passwordHash,
        passwordProtectionSessionTimeoutMinutes: config.passwordProtectionSessionTimeoutMinutes ?? existing.passwordProtectionSessionTimeoutMinutes,
        updatedBy,
      },
    })
  } else {
    await prisma.passwordProtectionConfig.create({
      data: {
        passwordProtectionEnabled: config.passwordProtectionEnabled ?? false,
        passwordProtectionStartDate: config.passwordProtectionStartDate ?? null,
        passwordProtectionEndDate: config.passwordProtectionEndDate ?? null,
        passwordProtectionPasswordHash: passwordHash,
        passwordProtectionSessionTimeoutMinutes: config.passwordProtectionSessionTimeoutMinutes ?? SESSION_TIMEOUT_MINUTES,
        updatedBy,
      },
    })
  }
}

