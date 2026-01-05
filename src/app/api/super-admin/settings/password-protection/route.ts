/**
 * GET /api/super-admin/settings/password-protection
 * PUT /api/super-admin/settings/password-protection
 * 
 * Get and update password protection configuration
 * Requires: super_admin role
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApi } from "@/lib/super-admin-guards"
import { getPasswordProtectionConfig, updatePasswordProtectionConfig } from "@/lib/password-protection"
import { PasswordProtectionConfig } from "@/lib/password-protection"

export async function GET() {
  const session = await requireSuperAdminPermissionApi("system", "read")
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const config = await getPasswordProtectionConfig()
    return NextResponse.json(config)
  } catch (error: any) {
    console.error("Error fetching password protection config:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Konfiguration" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await requireSuperAdminPermissionApi("system", "update")
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const body = await request.json()
    const config: Partial<PasswordProtectionConfig> = {
      passwordProtectionEnabled: body.passwordProtectionEnabled,
      passwordProtectionStartDate: body.passwordProtectionStartDate ? new Date(body.passwordProtectionStartDate) : null,
      passwordProtectionEndDate: body.passwordProtectionEndDate ? new Date(body.passwordProtectionEndDate) : null,
      passwordProtectionPasswordHash: body.passwordProtectionPasswordHash || undefined,
      passwordProtectionSessionTimeoutMinutes: body.passwordProtectionSessionTimeoutMinutes || 60,
    }

    await updatePasswordProtectionConfig(config, session.id)

    return NextResponse.json({
      success: true,
      message: "Konfiguration erfolgreich aktualisiert"
    })
  } catch (error: any) {
    console.error("Error updating password protection config:", error)
    return NextResponse.json(
      { error: "Fehler beim Speichern der Konfiguration" },
      { status: 500 }
    )
  }
}

