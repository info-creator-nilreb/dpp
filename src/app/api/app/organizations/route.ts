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

