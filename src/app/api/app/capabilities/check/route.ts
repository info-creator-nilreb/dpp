/**
 * CAPABILITY CHECK API
 * 
 * Check if a feature is available for an organization
 * OR get all available features if no feature key is provided
 */

import { auth } from "@/auth"
import { hasFeature, getAvailableFeatures } from "@/lib/capabilities/resolver"
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

  // Get organization ID from session or parameter
  const orgId = organizationId || (session.user as any).organizationId

  if (!orgId) {
    return NextResponse.json(
      { error: "Organization ID is required" },
      { status: 400 }
    )
  }

  try {
    // If no feature key, return all available features
    if (!featureKey) {
      const features = await getAvailableFeatures({
        organizationId: orgId,
        userId: session.user.id,
      })

      return NextResponse.json({
        features,
        organizationId: orgId,
      })
    }

    // Otherwise check specific feature
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

