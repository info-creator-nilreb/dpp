export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * Checks if the current user needs onboarding
 */
function isPlaceholderName(organizationName: string, userEmail: string, userName?: string | null): boolean {
  const emailPrefix = userEmail.split("@")[0]
  
  if (organizationName.toLowerCase() === emailPrefix.toLowerCase()) {
    return true
  }
  
  if (userName && organizationName.toLowerCase() === userName.toLowerCase()) {
    return true
  }
  
  return false
}

/**
 * GET /api/app/onboarding/check
 * 
 * Checks if the current user needs onboarding
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ needsOnboarding: false }, { status: 200 })
    }

    // Hole die erste Organization des Users
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        organization: true
      }
    })

    if (!membership?.organization) {
      return NextResponse.json({ needsOnboarding: false }, { status: 200 })
    }

    // Prüfe ob Organization-Name ein Platzhalter ist
    const needsOnboarding = isPlaceholderName(
      membership.organization.name,
      session.user.email,
      session.user.name
    )

    return NextResponse.json({ needsOnboarding }, { status: 200 })
  } catch (error) {
    console.error("Error checking onboarding:", error)
    return NextResponse.json({ needsOnboarding: false }, { status: 200 })
  }
}

