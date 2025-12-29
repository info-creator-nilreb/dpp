/**
 * CAPABILITY CHECK API
 * 
 * Check if a feature is available for an organization
 */

import { auth } from "@/auth"
import { hasFeature } from "@/lib/capabilities/resolver"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const featureKey = searchParams.get("feature")
  const organizationId = searchParams.get("organizationId")

  if (!featureKey) {
    return NextResponse.json(
      { error: "Feature key is required" },
      { status: 400 }
    )
  }

  // Get organization ID from session or parameter
  const orgId = organizationId || (session.user as any).organizationId

  if (!orgId) {
    return NextResponse.json(
      { error: "Organization ID is required" },
      { status: 400 }
    )
  }

  try {
    const available = await hasFeature(featureKey, {
      organizationId: orgId,
      userId: session.user.id,
    })

    return NextResponse.json({
      feature: featureKey,
      available,
      organizationId: orgId,
    })
  } catch (error: any) {
    console.error("Error checking capability:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check capability" },
      { status: 500 }
    )
  }
}

