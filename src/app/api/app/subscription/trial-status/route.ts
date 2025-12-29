import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isInTrial } from "@/lib/pricing/features"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId ist erforderlich" },
        { status: 400 }
      )
    }

    // Check if user is member of organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Keine Berechtigung für diese Organisation" },
        { status: 403 }
      )
    }

    // Check trial status
    const inTrial = await isInTrial(organizationId)

    if (!inTrial) {
      return NextResponse.json({
        inTrial: false,
        daysRemaining: null,
        trialExpiresAt: null
      })
    }

    // Get subscription details
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        subscriptionModel: true
      }
    })

    if (!subscription || !subscription.trialExpiresAt) {
      return NextResponse.json({
        inTrial: false,
        daysRemaining: null,
        trialExpiresAt: null
      })
    }

    const now = new Date()
    const expiresAt = new Date(subscription.trialExpiresAt)
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    return NextResponse.json({
      inTrial: true,
      daysRemaining,
      trialExpiresAt: subscription.trialExpiresAt.toISOString()
    })
  } catch (error: any) {
    console.error("[Trial Status API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Abrufen des Trial-Status" },
      { status: 500 }
    )
  }
}


