export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    })

    if (!dpp) {
      return NextResponse.json({ hasAccess: false }, { status: 200 })
    }

    const hasAccess = dpp.organization.memberships.length > 0
    return NextResponse.json({ hasAccess }, { status: 200 })
  } catch (error) {
    console.error("Error checking DPP access:", error)
    return NextResponse.json({ hasAccess: false }, { status: 200 })
  }
}

