/**
 * Get Client IP Address from Request
 * 
 * Extracts the real client IP address from Next.js request headers,
 * handling proxies and load balancers.
 */
export function getClientIp(request: Request): string | undefined {
  // Check x-forwarded-for header (most common in proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwarded.split(",").map(ip => ip.trim())
    if (ips.length > 0 && ips[0]) {
      return ips[0]
    }
  }

  // Check x-real-ip header (alternative proxy header)
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  // Fallback: try to extract from connection (not available in Next.js Edge/Serverless)
  // In Next.js, we typically rely on headers
  return undefined
}


