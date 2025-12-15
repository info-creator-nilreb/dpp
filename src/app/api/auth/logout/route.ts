export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { signOut } from "@/auth"

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user and redirects to login page
 */
export async function POST() {
  try {
    await signOut()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    )
  }
}

