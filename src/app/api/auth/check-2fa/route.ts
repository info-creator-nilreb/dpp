import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/auth/check-2fa
 * 
 * Prüft ob ein User 2FA benötigt oder zeigt 2FA-Status
 * - Ohne Parameter: Prüft aktuell eingeloggten User (für Security-Seite)
 * - Mit email Parameter: Prüft spezifischen User (für Login-Flow)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    let userId: string | undefined
    let userEmail: string | undefined

    // Wenn email Parameter vorhanden (Login-Flow)
    if (email) {
      userEmail = email
    } else {
      // Sonst: Session-basiert (Security-Seite)
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Nicht autorisiert" },
          { status: 401 }
        )
      }
      userId = session.user.id
      userEmail = session.user.email || undefined
    }

    const user = await prisma.user.findUnique({
      where: email ? { email } : { id: userId! },
      select: {
        systemRole: true,
        isPlatformAdmin: true,
        totpEnabled: true,
        totpSecret: true,
      },
    })

    if (!user) {
      return NextResponse.json({ requires2FA: false, isSuperAdmin: false, totpEnabled: false }, { status: 200 })
    }

    // Prüfe ob Super Admin (mit userId falls vorhanden, sonst mit user-Daten)
    const adminCheck = userId ? await isSuperAdmin(userId) : (user.systemRole === "SUPER_ADMIN" || user.isPlatformAdmin === true)
    const requires2FA = adminCheck && user.totpEnabled && !!user.totpSecret

    return NextResponse.json({ 
      requires2FA, 
      isSuperAdmin: adminCheck, 
      totpEnabled: user.totpEnabled || false 
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error checking 2FA:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

