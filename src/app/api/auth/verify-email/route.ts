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

    if (!token) {
      return NextResponse.json(
        { error: "Token ist erforderlich" },
        { status: 400 }
      )
    }

    // User mit diesem Token finden
    const user = await prisma.user.findUnique({
      where: { verificationToken: token }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Ungültiger Verifizierungs-Token" },
        { status: 400 }
      )
    }

    // Prüfen ob Token abgelaufen ist
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return NextResponse.json(
        { error: "TOKEN_EXPIRED" },
        { status: 400 }
      )
    }

    // E-Mail als verifiziert markieren und Token entfernen
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      }
    })

    return NextResponse.json(
      { message: "E-Mail erfolgreich verifiziert" },
      { status: 200 }
    )
  } catch (error) {
    console.error("VERIFY EMAIL ERROR", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

