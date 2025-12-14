export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/app/organization/update-name
 * 
 * Aktualisiert den Namen der Organisation des eingeloggten Users
 * - Prüft ob User eingeloggt ist
 * - Findet die erste Organization des Users
 * - Aktualisiert den Namen
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

    const { name } = await request.json()

    // Validierung
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: "Der Name muss mindestens 2 Zeichen lang sein" },
        { status: 400 }
      )
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Der Name darf maximal 100 Zeichen lang sein" },
        { status: 400 }
      )
    }

    // Finde die erste Organization des Users
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        organization: true
      }
    })

    if (!membership?.organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Aktualisiere den Organization-Namen
    await prisma.organization.update({
      where: {
        id: membership.organization.id
      },
      data: {
        name: trimmedName
      }
    })

    return NextResponse.json(
      { message: "Organisationsname erfolgreich aktualisiert", name: trimmedName },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating organization name:", error)
    
    if (error.code === "P2025") {
      // Record not found
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

