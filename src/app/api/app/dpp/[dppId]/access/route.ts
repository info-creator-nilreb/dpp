export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { canViewDPP } from "@/lib/permissions"

/**
 * GET /api/app/dpp/[dppId]/access
 * 
 * Checks if the current user has access to a DPP
 */
export async function GET(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ hasAccess: false }, { status: 200 })
    }

    const hasAccess = await canViewDPP(session.user.id, params.dppId)
    return NextResponse.json({ hasAccess }, { status: 200 })
  } catch (error) {
    console.error("Error checking DPP access:", error)
    return NextResponse.json({ hasAccess: false }, { status: 200 })
  }
}

