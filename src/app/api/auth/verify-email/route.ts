export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/auth/verify-email
 * 
 * Verifiziert eine E-Mail-Adresse mit einem Token
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string") {
      console.error("[VERIFY_EMAIL] Missing or invalid token")
      return NextResponse.json(
        { error: "Token ist erforderlich" },
        { status: 400 }
      )
    }

    // User mit diesem Token finden
    let user
    try {
      user = await prisma.user.findUnique({
        where: { verificationToken: token }
      })
    } catch (dbError: any) {
      console.error("[VERIFY_EMAIL] Database error:", dbError)
      return NextResponse.json(
        { error: "Datenbankfehler - bitte versuchen Sie es erneut" },
        { status: 500 }
      )
    }

    if (!user) {
      console.warn(`[VERIFY_EMAIL] User not found for token: ${token.substring(0, 8)}...`)
      return NextResponse.json(
        { error: "Ungültiger Verifizierungs-Token" },
        { status: 400 }
      )
    }

    // Prüfen ob Token abgelaufen ist
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      console.warn(`[VERIFY_EMAIL] Token expired for user: ${user.id}`)
      return NextResponse.json(
        { error: "TOKEN_EXPIRED" },
        { status: 400 }
      )
    }

    // E-Mail als verifiziert markieren und Token entfernen
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null
        }
      })
      console.log(`[VERIFY_EMAIL] Email verified successfully for user: ${user.id}`)
    } catch (updateError: any) {
      console.error("[VERIFY_EMAIL] Error updating user:", updateError)
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der E-Mail-Verifizierung" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "E-Mail erfolgreich verifiziert" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[VERIFY_EMAIL] Unexpected error:", error)
    console.error("[VERIFY_EMAIL] Error stack:", error?.stack)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

