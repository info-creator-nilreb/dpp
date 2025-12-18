export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/auth/check-verification?email=...
 * 
 * Prüft ob eine E-Mail-Adresse verifiziert ist
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        emailVerified: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      emailVerified: user.emailVerified
    })
  } catch (error) {
    console.error("CHECK VERIFICATION ERROR", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

