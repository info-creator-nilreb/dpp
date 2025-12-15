export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/account
 * 
 * Holt Account-Informationen des eingeloggten Users
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching account:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/account
 * 
 * Aktualisiert Account-Informationen des eingeloggten Users
 */
export async function PUT(request: Request) {
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
    if (name !== undefined && (typeof name !== "string" || name.trim().length > 100)) {
      return NextResponse.json(
        { error: "Name muss ein String mit maximal 100 Zeichen sein" },
        { status: 400 }
      )
    }

    // Aktualisiere User
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name?.trim() || null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    return NextResponse.json({
      message: "Account erfolgreich aktualisiert",
      user: updatedUser
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error updating account:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

