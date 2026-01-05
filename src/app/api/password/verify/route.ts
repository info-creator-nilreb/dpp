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
    
    // Return JSON response with success and cookie
    // Client will handle redirect after cookie is set
    const response = NextResponse.json({
      success: true,
      message: "Zugriff gewährt",
      callbackUrl: callbackUrlParam || "/"
    })

    // Set cookie in response headers (for API routes, use response.cookies)
    // Important: Use sameSite: "lax" and path: "/" to ensure cookie is available everywhere
    // In development, secure must be false (cookies won't work over http://)
    const isProduction = process.env.NODE_ENV === "production"
    response.cookies.set("password_protection_access", cookieValue, {
      httpOnly: true,
      secure: isProduction, // false in dev (http://), true in prod (https://)
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      path: "/",
    })
    
    // Debug: Log cookie setting
    console.log("[Password Verify] Cookie set:", {
      name: "password_protection_access",
      hasValue: !!cookieValue,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      callbackUrl: callbackUrlParam || "/"
    })

    return response
  } catch (error: any) {
    console.error("Error verifying password:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

