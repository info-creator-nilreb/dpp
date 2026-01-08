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

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: "Passwort ist erforderlich" },
        { status: 400 }
      )
    }

    // Trim password (konsistent mit anderen Auth-Funktionen)
    const trimmedPassword = password.trim()

    if (!trimmedPassword) {
      return NextResponse.json(
        { error: "Passwort ist erforderlich" },
        { status: 400 }
      )
    }

    // Verify password
    let isValid = false
    try {
      isValid = await verifyPasswordProtectionPassword(trimmedPassword)
      // Debug-Logging auch in Produktion (für Troubleshooting)
      console.log("[PASSWORD_VERIFY] Password verification result:", {
        isValid,
        passwordLength: trimmedPassword.length,
        isProduction: process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
      })
    } catch (error: any) {
      console.error("[PASSWORD_VERIFY] Error verifying password:", error)
      return NextResponse.json(
        { error: "Fehler bei der Passwortprüfung" },
        { status: 500 }
      )
    }

    if (!isValid) {
      console.warn("[PASSWORD_VERIFY] Password invalid", {
        passwordLength: trimmedPassword.length,
        isProduction: process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
      })
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
    
    // Verwende das gleiche Pattern wie Super-Admin Login: JSON Response + Cookie
    // Statt Server-Side Redirect (was in Produktion Probleme verursachen kann)
    const response = NextResponse.json({
      success: true,
      message: "Passwort erfolgreich verifiziert",
      callbackUrl: callbackUrlParam || "/"
    })
    
    // Set cookie in response headers (wie Super-Admin Login)
    response.cookies.set("password_protection_access", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      path: "/",
    })
    
    console.log("[PASSWORD_VERIFY] Cookie set successfully", {
      cookieName: "password_protection_access",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60
    })
    
    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

