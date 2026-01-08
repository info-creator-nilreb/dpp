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
    } catch (error: any) {
      return NextResponse.json(
        { error: "Fehler bei der Passwortprüfung" },
        { status: 500 }
      )
    }

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
    
    // Erstelle absolute URL für Redirect
    // Wenn redirectUrl bereits absolut ist, verwende sie direkt, sonst relativ zu request.url
    let absoluteRedirectUrl: URL
    try {
      absoluteRedirectUrl = new URL(redirectUrl)
    } catch {
      // Relative URL - mache sie absolut
      // Verwende request.url als Base, aber extrahiere nur die Origin
      const requestUrl = new URL(request.url)
      absoluteRedirectUrl = new URL(redirectUrl, `${requestUrl.protocol}//${requestUrl.host}`)
    }
    
    // Erstelle Redirect-Response
    const redirectResponse = NextResponse.redirect(absoluteRedirectUrl, { status: 307 })
    
    // Set cookie in redirect response headers
    // Important: Use sameSite: "lax" and path: "/" to ensure cookie is available everywhere
    // In Produktion: secure muss true sein für HTTPS
    redirectResponse.cookies.set("password_protection_access", cookieValue, {
      httpOnly: true,
      secure: isProduction, // false in dev (http://), true in prod (https://)
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      path: "/",
      // Domain wird automatisch gesetzt, aber wir können es explizit setzen falls nötig
    })
    
    return redirectResponse
  } catch (error: any) {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

