/**
 * Audit Log Utilities
 * 
 * Helper functions for extracting request metadata for audit logs
 */

import { NextRequest } from "next/server"

/**
 * Extract IP address from request headers
 * Handles various proxy headers (x-forwarded-for, x-real-ip, etc.)
 */
export function getClientIp(request: NextRequest): string | undefined {
  // Try x-forwarded-for first (most common in production)
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(",").map(ip => ip.trim())
    return ips[0] || undefined
  }

  // Try x-real-ip (nginx)
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Try cf-connecting-ip (Cloudflare)
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp
  }

  // Fallback: try to get from request IP (may not work in all environments)
  // Note: NextRequest doesn't have a direct IP property, so we return undefined
  return undefined
}

