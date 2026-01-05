/**
 * Password Protection Wrapper (Server Component)
 * 
 * Wraps all routes (except /super-admin and /password) and checks if password protection is active.
 * If active and no access cookie, redirects to password page.
 * 
 * This runs in Node.js Runtime (not Edge), so Prisma is available.
 */

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { isPasswordProtectionActive, hasPasswordProtectionAccess } from "@/lib/password-protection"

interface PasswordProtectionWrapperProps {
  children: React.ReactNode
}

export default async function PasswordProtectionWrapper({
  children,
}: PasswordProtectionWrapperProps) {
  // Get pathname from headers - try multiple sources
  const headersList = await headers()
  let pathname = headersList.get("x-pathname") || 
                 headersList.get("x-invoke-path") || 
                 headersList.get("referer") || 
                 ""
  
  // Extract pathname from referer if needed
  if (pathname && pathname.startsWith("http")) {
    try {
      const url = new URL(pathname)
      pathname = url.pathname
    } catch {
      pathname = ""
    }
  }
  
  // Skip check for unprotected routes - MUST be first check
  if (
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/api/super-admin") ||
    pathname === "/password" ||
    pathname.startsWith("/api/password") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === ""
  ) {
    return <>{children}</>
  }

  try {
    // Check if password protection is active (requires Prisma - Node.js Runtime only)
    const protectionActive = await isPasswordProtectionActive()

    if (protectionActive) {
      // Check if user has valid access
      const hasAccess = await hasPasswordProtectionAccess()
      
      // Debug: Log access check (server-side - appears in terminal, not browser console)
      if (!hasAccess) {
        console.log("[PasswordProtectionWrapper] No access - pathname:", pathname, "protectionActive:", protectionActive)
        
        // Only redirect if not already on password page (prevent loop)
        if (pathname !== "/password" && !pathname.startsWith("/api")) {
          // Use the current pathname or "/" as callbackUrl
          const currentPath = pathname || "/"
          console.log("[PasswordProtectionWrapper] Redirecting to password page:", currentPath)
          redirect(`/password?callbackUrl=${encodeURIComponent(currentPath)}`)
        }
      } else {
        console.log("[PasswordProtectionWrapper] Access granted - pathname:", pathname)
      }
    }
  } catch (error) {
    // If password protection check fails, log error but don't block access
    // This prevents the entire app from breaking if there's a DB issue
    console.error("[PasswordProtectionWrapper] Error checking password protection:", error)
    // Continue rendering - don't block access on error
  }

  return <>{children}</>
}

