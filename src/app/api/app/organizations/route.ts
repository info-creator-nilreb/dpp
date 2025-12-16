export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/organizations
 * 
 * Holt alle Organizations, in denen der User Mitglied ist
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

    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        organization: true
      }
    })

    const organizations = memberships.map(m => ({
      id: m.organization.id,
      name: m.organization.name
    }))

    return NextResponse.json({ organizations }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/organizations
 * 
 * Aktualisiert den Namen der ersten Organisation des eingeloggten Users
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
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: membership.organization.id
      },
      data: {
        name: trimmedName
      }
    })

    return NextResponse.json(
      { 
        success: true,
        organization: {
          id: updatedOrganization.id,
          name: updatedOrganization.name
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating organization:", error)
    
    if (error.code === "P2025") {
      // Record not found
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

