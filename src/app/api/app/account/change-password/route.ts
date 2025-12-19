export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * POST /api/app/account/change-password
 * 
 * Ändert das Passwort des eingeloggten Users
 * - Validiert aktuelles Passwort
 * - Prüft neue Passwort-Anforderungen
 * - Hasht neues Passwort
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // Validierung
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Aktuelles Passwort und neues Passwort sind erforderlich" },
        { status: 400 }
      )
    }

    // Passwort-Mindestlänge: 8 Zeichen
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Das neue Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      )
    }

    // Lade User mit Passwort
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User nicht gefunden" },
        { status: 404 }
      )
    }

    // Prüfe aktuelles Passwort
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Aktuelles Passwort ist falsch" },
        { status: 400 }
      )
    }

    // Prüfe ob neues Passwort sich vom alten unterscheidet
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden" },
        { status: 400 }
      )
    }

    // Hashe neues Passwort
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Aktualisiere Passwort
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword
      }
    })

    return NextResponse.json({
      message: "Passwort wurde erfolgreich geändert"
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

