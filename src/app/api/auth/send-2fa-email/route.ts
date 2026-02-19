import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { send2FACodeEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CODE_EXPIRY_MINUTES = 10

/**
 * POST /api/auth/send-2fa-email
 *
 * Sendet einen Einmal-Code an die E-Mail des eingeloggten Users.
 * Für 2FA-Aktivierung (Security-Seite) oder Login (wenn twoFactorMethod = email).
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, firstName: true, lastName: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const hash = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email2FACodeHash: hash,
        email2FACodeExpiresAt: expiresAt,
      },
    })

    const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || null
    await send2FACodeEmail(user.email, name, code)

    return NextResponse.json({
      success: true,
      message: "Code wurde an Ihre E-Mail-Adresse gesendet.",
      expiresInMinutes: CODE_EXPIRY_MINUTES,
    }, { status: 200 })
  } catch (e: any) {
    console.error("[send-2fa-email]", e)
    return NextResponse.json(
      { error: e?.message || "Code konnte nicht gesendet werden." },
      { status: 500 }
    )
  }
}
