export const runtime = "nodejs"
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
  } catch (error) {
    // Vollständiges Error-Logging für Debugbarkeit
    console.error("SIGNUP ERROR", error)
    
    // Spezifischere Fehlermeldungen für häufige Fälle
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      // Unique constraint violation (E-Mail bereits vorhanden)
      return NextResponse.json(
        { error: "Diese E-Mail ist bereits registriert" },
        { status: 400 }
      )
    }
    
    // Echte Fehlermeldung zurückgeben
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

