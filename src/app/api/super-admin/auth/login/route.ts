/**
 * SUPER ADMIN LOGIN API
 * 
 * COMPLETELY SEPARATE from tenant auth.
 * - Only checks SuperAdmin table
 * - Creates SuperAdmin session
 * - NEVER touches User table
 */

import { NextResponse } from "next/server"
import { authenticateSuperAdmin, createSuperAdminSession } from "@/lib/super-admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("[SUPER_ADMIN_LOGIN] Login attempt:", { email: email?.substring(0, 5) + "..." })

    if (!email || !password) {
      console.log("[SUPER_ADMIN_LOGIN] Missing credentials")
      return NextResponse.json(
        { error: "E-Mail und Passwort sind erforderlich" },
        { status: 400 }
      )
    }

    // ONLY authenticate against SuperAdmin table
    const session = await authenticateSuperAdmin(email, password)

    if (!session) {
      console.log("[SUPER_ADMIN_LOGIN] Authentication failed")
      return NextResponse.json(
        { error: "Ungültige Anmeldedaten" },
        { status: 401 }
      )
    }

    console.log("[SUPER_ADMIN_LOGIN] Authentication successful, creating session...")

    // Create SuperAdmin session (separate cookie)
    await createSuperAdminSession(session)

    console.log("[SUPER_ADMIN_LOGIN] Session created successfully")

    return NextResponse.json({
      success: true,
      admin: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role
      }
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_LOGIN] Error:", error)
    console.error("[SUPER_ADMIN_LOGIN] Error stack:", error.stack)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten: " + (error.message || "Unbekannter Fehler") },
      { status: 500 }
    )
  }
}

