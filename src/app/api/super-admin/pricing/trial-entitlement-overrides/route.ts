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
    const { subscriptionModelId, entitlementKey, value } = body

    if (!subscriptionModelId || !entitlementKey) {
      return NextResponse.json(
        { error: "subscriptionModelId und entitlementKey sind erforderlich" },
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

    // Create or update trial entitlement override
    const override = await prisma.trialEntitlementOverride.upsert({
      where: {
        subscriptionModelId_entitlementKey: {
          subscriptionModelId,
          entitlementKey
        }
      },
      create: {
        subscriptionModelId,
        entitlementKey,
        value: value === null || value === undefined ? null : parseInt(value)
      },
      update: {
        value: value === null || value === undefined ? null : parseInt(value)
      }
    })

    return NextResponse.json({ override }, { status: 201 })
  } catch (error: any) {
    console.error("[Trial Entitlement Override POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen des Trial Entitlement Overrides" },
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
    const entitlementKey = searchParams.get("entitlementKey")

    if (!subscriptionModelId || !entitlementKey) {
      return NextResponse.json(
        { error: "subscriptionModelId und entitlementKey sind erforderlich" },
        { status: 400 }
      )
    }

    await prisma.trialEntitlementOverride.delete({
      where: {
        subscriptionModelId_entitlementKey: {
          subscriptionModelId,
          entitlementKey
        }
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("[Trial Entitlement Override DELETE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Löschen des Trial Entitlement Overrides" },
      { status: 500 }
    )
  }
}


