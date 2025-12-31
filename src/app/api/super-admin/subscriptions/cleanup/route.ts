/**
 * SUPER ADMIN: Subscription Cleanup API
 * 
 * Phase 1.9: Cleanup invalid subscription states
 * Requires super_admin permission
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import {
  detectInvalidSubscriptionStates,
  cleanupAllInvalidSubscriptionStates,
} from "@/lib/phase1.9/subscription-cleanup"
import { getSuperAdminSession } from "@/lib/super-admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: Detect invalid subscription states
export async function GET() {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const invalidStates = await detectInvalidSubscriptionStates()

    return NextResponse.json({
      invalidStates,
      count: invalidStates.length,
    })
  } catch (error: any) {
    console.error("[SUBSCRIPTION_CLEANUP] GET error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erkennen ungültiger Subscription-States" },
      { status: 500 }
    )
  }
}

// POST: Cleanup all invalid subscription states
export async function POST(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await request.json()
    const { reason, confirm } = body

    if (!confirm) {
      return NextResponse.json(
        { error: "Bestätigung erforderlich. Setzen Sie 'confirm: true'." },
        { status: 400 }
      )
    }

    const cleanupReason = reason || `Phase 1.9: Legacy subscription cleanup by Super Admin ${session.email}`

    const result = await cleanupAllInvalidSubscriptionStates(
      cleanupReason,
      session.id
    )

    return NextResponse.json({
      success: true,
      cleaned: result.cleaned,
      errors: result.errors,
      message: `${result.cleaned} ungültige Subscription-States bereinigt`,
    })
  } catch (error: any) {
    console.error("[SUBSCRIPTION_CLEANUP] POST error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Bereinigen ungültiger Subscription-States" },
      { status: 500 }
    )
  }
}

