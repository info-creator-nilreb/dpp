import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/auth/check-2fa
 *
 * Prüft 2FA-Status für jeden User (nicht nur Super Admins).
 * - Ohne Parameter: aktuell eingeloggter User (Security-Seite)
 * - Mit email: Login-Flow
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    let userId: string | undefined

    if (email) {
      // Login-Flow: nur email
    } else {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Nicht autorisiert" },
          { status: 401 }
        )
      }
      userId = session.user.id
    }

    const user = await prisma.user.findUnique({
      where: email ? { email: email.toLowerCase().trim() } : { id: userId! },
      select: {
        systemRole: true,
        isPlatformAdmin: true,
        totpEnabled: true,
        totpSecret: true,
        twoFactorMethod: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        requires2FA: false,
        isSuperAdmin: false,
        totpEnabled: false,
        twoFactorMethod: null,
      }, { status: 200 })
    }

    const adminCheck = userId ? await isSuperAdmin(userId) : (user.systemRole === "SUPER_ADMIN" || user.isPlatformAdmin === true)
    const totpEnabled = user.totpEnabled || false
    const method = user.twoFactorMethod || (user.totpSecret ? "totp" : null)
    const requires2FA = totpEnabled && (method === "totp" ? !!user.totpSecret : method === "email")

    return NextResponse.json({
      requires2FA,
      isSuperAdmin: adminCheck,
      totpEnabled,
      twoFactorMethod: method,
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error checking 2FA:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

