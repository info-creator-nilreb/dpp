/**
 * FEATURES API
 * 
 * Returns all available features for the current user's organization
 */

import { auth } from "@/auth"
import { getAvailableFeatures } from "@/lib/capabilities/resolver"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get organization ID from session
    const orgId = (session.user as any).organizationId

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID not found" },
        { status: 400 }
      )
    }

    const availableFeatures = await getAvailableFeatures({
      organizationId: orgId,
      userId: session.user.id,
    })

    return NextResponse.json({
      features: availableFeatures,
      organizationId: orgId,
    })
  } catch (error: any) {
    console.error("Error fetching available features:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch features" },
      { status: 500 }
    )
  }
}

