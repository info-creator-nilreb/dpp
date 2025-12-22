/**
 * SUPER ADMIN LOGOUT API
 * 
 * Destroys SuperAdmin session ONLY
 */

import { NextResponse } from "next/server"
import { destroySuperAdminSession } from "@/lib/super-admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  await destroySuperAdminSession()

  // Redirect to login page after logout
  return NextResponse.redirect(new URL("/super-admin/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"))
}
