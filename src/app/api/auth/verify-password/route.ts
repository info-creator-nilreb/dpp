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
      return NextResponse.json(
        { error: "E-Mail und Passwort erforderlich" },
        { status: 400 }
      )
    }

    // User aus Datenbank laden
    const user = await prisma.user.findUnique({
      where: { email },
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

    if (!user) {
      return NextResponse.json(
        { error: "Ungültige E-Mail oder Passwort", requires2FA: false },
        { status: 401 }
      )
    }

    // Prüfen ob E-Mail verifiziert ist (Super Admins können immer einloggen)
    const isSuperAdmin = user.systemRole === "SUPER_ADMIN" || user.isPlatformAdmin === true
    if (!user.emailVerified && !isSuperAdmin) {
      return NextResponse.json(
        { error: "E-Mail nicht verifiziert", requires2FA: false },
        { status: 401 }
      )
    }

    // PASSWORT PRÜFEN
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Ungültige E-Mail oder Passwort", requires2FA: false },
        { status: 401 }
      )
    }

    // Passwort ist korrekt - prüfe ob 2FA erforderlich ist
    const requires2FA = isSuperAdmin && user.totpEnabled && !!user.totpSecret

    return NextResponse.json({
      success: true,
      requires2FA,
      isSuperAdmin
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error verifying password:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

