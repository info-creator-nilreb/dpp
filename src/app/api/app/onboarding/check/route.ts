export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/app/onboarding/check
 * 
 * Checks if the current user needs onboarding.
 * 
 * Business rule: User needs onboarding ONLY if they have ZERO organization memberships
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ needsOnboarding: false }, { status: 200 })
    }

    // Prüfe Anzahl der Memberships des Users
    // User braucht Onboarding NUR wenn count === 0
    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true
      }
    })

    // needsOnboarding = true nur wenn KEINE Memberships vorhanden
    const needsOnboarding = memberships.length === 0

    return NextResponse.json({ needsOnboarding }, { status: 200 })
  } catch (error) {
    console.error("Error checking onboarding:", error)
    return NextResponse.json({ needsOnboarding: false }, { status: 200 })
  }
}

