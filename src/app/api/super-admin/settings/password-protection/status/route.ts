/**
 * GET /api/super-admin/settings/password-protection/status
 * 
 * Check if password protection is currently active
 * Requires: super_admin role
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApi } from "@/lib/super-admin-guards"
import { isPasswordProtectionActive } from "@/lib/password-protection"

export async function GET() {
  const session = await requireSuperAdminPermissionApi("system", "read")
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const isActive = await isPasswordProtectionActive()
    return NextResponse.json({ isActive })
  } catch (error: any) {
    console.error("Error checking password protection status:", error)
    return NextResponse.json(
      { error: "Fehler beim Prüfen des Status" },
      { status: 500 }
    )
  }
}

