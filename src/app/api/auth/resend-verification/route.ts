/**
 * POST /api/auth/resend-verification
 * 
 * Sendet eine Verifizierungs-E-Mail erneut an die angegebene E-Mail-Adresse
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-Mail-Adresse ist erforderlich" },
        { status: 400 }
      )
    }

    // User finden
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
      },
    })

    if (!user) {
      // Aus Sicherheitsgründen keine Information geben, ob User existiert
      return NextResponse.json(
        { success: true, message: "Falls ein Konto mit dieser E-Mail existiert, wurde eine Verifizierungs-E-Mail gesendet." },
        { status: 200 }
      )
    }

    // Wenn bereits verifiziert, keine E-Mail senden
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits verifiziert" },
        { status: 400 }
      )
    }

    // Neuen Verifizierungs-Token generieren
    const verificationToken = randomBytes(32).toString("hex")
    const verificationTokenExpires = new Date()
    verificationTokenExpires.setDate(verificationTokenExpires.getDate() + 1) // 24 Stunden

    // Token in Datenbank speichern
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires,
      },
    })

    // Verifizierungs-E-Mail senden
    try {
      await sendVerificationEmail(
        user.email,
        user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
        verificationToken
      )
      console.log(`[RESEND_VERIFICATION] Verification email sent to: ${user.email}`)
    } catch (emailError) {
      console.error("[RESEND_VERIFICATION] Fehler beim Senden der Verifizierungs-E-Mail:", emailError)
      // E-Mail-Fehler sollte den Request nicht fehlschlagen lassen
      // (aus Sicherheitsgründen)
    }

    return NextResponse.json(
      { success: true, message: "Verifizierungs-E-Mail wurde gesendet" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[RESEND_VERIFICATION] Error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

