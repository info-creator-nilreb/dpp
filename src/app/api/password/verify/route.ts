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
    
    // Prüfe ob wir in Produktion sind (Vercel setzt VERCEL=1)
    // Oder prüfe ob die Request-URL HTTPS ist
    const requestUrl = new URL(request.url)
    const isHttps = requestUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || isHttps
    
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
      absoluteRedirectUrl = new URL(redirectUrl, `${requestUrl.protocol}//${requestUrl.host}`)
    }
    
    // Erstelle Redirect-Response
    const redirectResponse = NextResponse.redirect(absoluteRedirectUrl, { status: 307 })
    
    // Set cookie in redirect response headers
    // Important: Use sameSite: "lax" and path: "/" to ensure cookie is available everywhere
    // In Produktion: secure muss true sein für HTTPS
    redirectResponse.cookies.set("password_protection_access", cookieValue, {
      httpOnly: true,
      secure: isProduction, // true wenn HTTPS oder in Produktion
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      path: "/",
      // Domain wird automatisch gesetzt, aber wir können es explizit setzen falls nötig
      // domain: requestUrl.hostname // Normalerweise nicht nötig, kann Probleme verursachen
    })
    
    // Debug-Logging für Cookie-Setting
    console.log("[PASSWORD_VERIFY] Cookie set", {
      cookieName: "password_protection_access",
      secure: isProduction,
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MINUTES * 60,
      redirectUrl: absoluteRedirectUrl.toString(),
      isProduction: process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
    })
    
    return redirectResponse
  } catch (error: any) {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

