import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/verify-password
 * 
 * Prüft Passwort und gibt zurück, ob 2FA erforderlich ist
 * WICHTIG: Prüft NUR das Passwort, gibt KEINE Session zurück
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      console.error("[VERIFY_PASSWORD] Missing email or password")
      return NextResponse.json(
        { error: "E-Mail und Passwort erforderlich" },
        { status: 400 }
      )
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim()

    // User aus Datenbank laden
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          password: true,
          emailVerified: true,
          systemRole: true,
          isPlatformAdmin: true,
          totpEnabled: true,
          totpSecret: true
        }
      })
    } catch (dbError: any) {
      console.error("[VERIFY_PASSWORD] Database error:", dbError)
      // Bei Datenbankfehlern (z.B. Connection Pool) 500 zurückgeben, nicht 401
      return NextResponse.json(
        { error: "Datenbankfehler - bitte versuchen Sie es erneut" },
        { status: 500 }
      )
    }

    if (!user) {
      console.warn(`[VERIFY_PASSWORD] User not found for email: ${normalizedEmail}`)
      return NextResponse.json(
        { error: "Ungültige E-Mail oder Passwort", requires2FA: false },
        { status: 401 }
      )
    }

    // Prüfen ob E-Mail verifiziert ist (Super Admins können immer einloggen)
    const isSuperAdmin = user.systemRole === "SUPER_ADMIN" || user.isPlatformAdmin === true
    if (!user.emailVerified && !isSuperAdmin) {
      console.warn(`[VERIFY_PASSWORD] Email not verified for user: ${user.id}`)
      return NextResponse.json(
        { error: "E-Mail nicht verifiziert", requires2FA: false },
        { status: 401 }
      )
    }

    // PASSWORT PRÜFEN
    let isPasswordValid = false
    try {
      if (!user.password) {
        console.error(`[VERIFY_PASSWORD] User ${user.id} has no password set`)
        return NextResponse.json(
          { error: "Ungültige E-Mail oder Passwort", requires2FA: false },
          { status: 401 }
        )
      }
      isPasswordValid = await bcrypt.compare(password, user.password)
    } catch (bcryptError: any) {
      console.error("[VERIFY_PASSWORD] Bcrypt error:", bcryptError)
      return NextResponse.json(
        { error: "Fehler bei der Passwort-Prüfung" },
        { status: 500 }
      )
    }

    if (!isPasswordValid) {
      console.warn(`[VERIFY_PASSWORD] Invalid password for user: ${user.id}`)
      return NextResponse.json(
        { error: "Ungültige E-Mail oder Passwort", requires2FA: false },
        { status: 401 }
      )
    }

    // Passwort ist korrekt - prüfe ob 2FA erforderlich ist
    const requires2FA = isSuperAdmin && user.totpEnabled && !!user.totpSecret

    console.log(`[VERIFY_PASSWORD] Password verified successfully for user: ${user.id}, requires2FA: ${requires2FA}`)

    return NextResponse.json({
      success: true,
      requires2FA,
      isSuperAdmin
    }, { status: 200 })

  } catch (error: any) {
    console.error("[VERIFY_PASSWORD] Unexpected error:", error)
    console.error("[VERIFY_PASSWORD] Error stack:", error?.stack)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

