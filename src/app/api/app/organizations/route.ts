export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserOrganizations } from "@/lib/access"

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

    const organizations = await getUserOrganizations()

    return NextResponse.json(
      { organizations: organizations.map(org => ({ id: org.id, name: org.name })) },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

