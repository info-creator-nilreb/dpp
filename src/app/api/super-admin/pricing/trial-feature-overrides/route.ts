import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { getClientIp } from "@/lib/audit/audit-utils"
import { SuperAdminSession } from "@/lib/super-admin-auth"

export async function POST(req: NextRequest) {
  let session: SuperAdminSession | NextResponse | null = null
  try {
    session = await requireSuperAdminPermissionApiThrow("pricing", "create")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await req.json()
    const { subscriptionModelId, featureKey, enabled } = body

    if (!subscriptionModelId || !featureKey || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "subscriptionModelId, featureKey und enabled sind erforderlich" },
        { status: 400 }
      )
    }

    // Check if subscription model exists
    const subscriptionModel = await prisma.subscriptionModel.findUnique({
      where: { id: subscriptionModelId }
    })

    if (!subscriptionModel) {
      return NextResponse.json(
        { error: "Subscription Model nicht gefunden" },
        { status: 404 }
      )
    }

    // Create or update trial feature override
    const override = await prisma.trialFeatureOverride.upsert({
      where: {
        subscriptionModelId_featureKey: {
          subscriptionModelId,
          featureKey
        }
      },
      create: {
        subscriptionModelId,
        featureKey,
        enabled
      },
      update: {
        enabled
      }
    })

    return NextResponse.json({ override }, { status: 201 })
  } catch (error: any) {
    console.error("[Trial Feature Override POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen des Trial Feature Overrides" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  let session: SuperAdminSession | NextResponse | null = null
  try {
    session = await requireSuperAdminPermissionApiThrow("pricing", "delete")
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(req.url)
    const subscriptionModelId = searchParams.get("subscriptionModelId")
    const featureKey = searchParams.get("featureKey")

    if (!subscriptionModelId || !featureKey) {
      return NextResponse.json(
        { error: "subscriptionModelId und featureKey sind erforderlich" },
        { status: 400 }
      )
    }

    await prisma.trialFeatureOverride.delete({
      where: {
        subscriptionModelId_featureKey: {
          subscriptionModelId,
          featureKey
        }
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("[Trial Feature Override DELETE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Löschen des Trial Feature Overrides" },
      { status: 500 }
    )
  }
}


