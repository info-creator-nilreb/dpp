/**
 * FEATURES API
 * 
 * Returns all available features for the current user's organization
 */

import { auth } from "@/auth"
import { getAvailableFeatures } from "@/lib/capabilities/resolver"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get organization ID from membership (not from session, as session doesn't include it)
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: { id: true }
        }
      }
    })

    if (!membership?.organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const orgId = membership.organization.id

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

