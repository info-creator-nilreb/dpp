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
  try {
    // @ts-ignore - passwordProtectionConfig exists in Prisma schema
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
  } catch (error) {
    // Wenn Datenbank nicht erreichbar ist, gebe null zurück (kein Password Protection)
    return null
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
  try {
    const config = await getPasswordProtectionConfig()

    if (!config || !config.passwordProtectionPasswordHash) {
      return false
    }

    // Direkter Vergleich wie in anderen Teilen des Codes (auth.ts, super-admin-auth.ts)
    // bcrypt.compare() behandelt ungültige Hashes selbst und gibt false zurück
    const isValid = await bcrypt.compare(password, config.passwordProtectionPasswordHash)
    return isValid
  } catch (error: any) {
    // Bei Fehlern false zurückgeben
    return false
  }
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
    return false
  }

  try {
    const data = JSON.parse(cookie.value)
    
    if (!data.accessGranted || !data.lastActivityTimestamp) {
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

    return true
  } catch (error) {
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
  // @ts-ignore - passwordProtectionConfig exists in Prisma schema
  const existing = await prisma.passwordProtectionConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  })

  // Hash password if provided
  let passwordHash = config.passwordProtectionPasswordHash || existing?.passwordProtectionPasswordHash || null
  if (config.passwordProtectionPasswordHash && config.passwordProtectionPasswordHash !== existing?.passwordProtectionPasswordHash) {
    // Only hash if it's a new password (not already hashed)
    // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are typically 60 chars
    const providedPassword = String(config.passwordProtectionPasswordHash).trim()
    
    // Prüfe ob es bereits ein bcrypt Hash ist
    // Einfache Prüfung: Wenn es mit $2 beginnt und mindestens 60 Zeichen hat, ist es wahrscheinlich ein Hash
    const isBcryptHash = providedPassword.startsWith("$2") && providedPassword.length >= 60
    
    if (isBcryptHash) {
      // Already hashed - use as is
      passwordHash = providedPassword
    } else {
      // Plain text password - hash it
      passwordHash = await bcrypt.hash(providedPassword, 10)
    }
  }

  if (existing) {
    // @ts-ignore - passwordProtectionConfig exists in Prisma schema
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
    // @ts-ignore - passwordProtectionConfig exists in Prisma schema
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

