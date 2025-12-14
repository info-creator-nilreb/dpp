export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createUser } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/auth/signup
 * 
 * Erstellt einen neuen User-Account
 * - Validiert E-Mail und Passwort
 * - Prüft ob E-Mail bereits existiert
 * - Hasht Passwort sicher mit bcrypt
 * - Erstellt User in Datenbank
 */
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validierung: E-Mail und Passwort sind Pflichtfelder
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort sind erforderlich" },
        { status: 400 }
      )
    }

    // Passwort-Mindestlänge: 8 Zeichen
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      )
    }

    // Prüfen ob E-Mail bereits registriert ist
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Diese E-Mail ist bereits registriert" },
        { status: 400 }
      )
    }

    // User erstellen (Passwort wird in createUser() gehasht)
    const user = await createUser(email, password, name)

    return NextResponse.json(
      { message: "Konto erfolgreich erstellt", userId: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Signup error - Full details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    
    // Spezifischere Fehlermeldungen
    if (error.code === "P2002") {
      // Unique constraint violation (E-Mail bereits vorhanden)
      return NextResponse.json(
        { error: "Diese E-Mail ist bereits registriert" },
        { status: 400 }
      )
    }
    
    // Prisma-Fehler erkennen
    if (error.code?.startsWith("P")) {
      console.error("Prisma error code:", error.code)
      return NextResponse.json(
        { error: "Datenbankfehler. Bitte versuchen Sie es erneut." },
        { status: 500 }
      )
    }
    
    // Fehler bei Organization/Membership-Erstellung
    if (error.message?.includes("membership") || error.message?.includes("organization") || error.message?.includes("Membership") || error.message?.includes("Organization")) {
      return NextResponse.json(
        { error: "Fehler bei der Erstellung der Organisation. Bitte versuchen Sie es erneut." },
        { status: 500 }
      )
    }
    
    // Generische Fehlermeldung mit Details im Development-Modus
    const errorMessage = process.env.NODE_ENV === "development" 
      ? (error.message || error.toString() || "Ein Fehler ist aufgetreten")
      : "Ein Fehler ist aufgetreten"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

