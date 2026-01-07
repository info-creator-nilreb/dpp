/**
 * POST /api/password/verify
 * 
 * Verify password protection password and set access cookie
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { verifyPasswordProtectionPassword, setPasswordProtectionAccessCookie, isPasswordProtectionActive } from "@/lib/password-protection"

export async function POST(request: Request) {
  try {
    // Check if protection is active
    const protectionActive = await isPasswordProtectionActive()
    
    if (!protectionActive) {
      return NextResponse.json(
        { error: "Password Protection ist derzeit nicht aktiv" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { password, callbackUrl: callbackUrlParam } = body

    if (!password) {
      return NextResponse.json(
        { error: "Passwort ist erforderlich" },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = await verifyPasswordProtectionPassword(password)

    if (!isValid) {
      return NextResponse.json(
        { error: "Ungültiges Passwort" },
        { status: 401 }
      )
    }

    // Set access cookie in response headers
    const now = new Date()
    const cookieValue = JSON.stringify({
      accessGranted: true,
      lastActivityTimestamp: now.toISOString(),
    })

    const SESSION_TIMEOUT_MINUTES = 60
    const isProduction = process.env.NODE_ENV === "production"
    
    // Server-Side Redirect mit Cookie im Response-Header
    // Das stellt sicher, dass das Cookie gesetzt ist, bevor der Redirect passiert
    const redirectUrl = callbackUrlParam || "/"
    const redirectResponse = NextResponse.redirect(new URL(redirectUrl, request.url))
    
    // Set cookie in redirect response headers
    // Important: Use sameSite: "lax" and path: "/" to ensure cookie is available everywhere
    redirectResponse.cookies.set("password_protection_access", cookieValue, {
      httpOnly: true,
      secure: isProduction, // false in dev (http://), true in prod (https://)
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      path: "/",
    })
    
    return redirectResponse
  } catch (error: any) {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

