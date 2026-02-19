import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { send2FACodeEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CODE_EXPIRY_MINUTES = 10

/**
 * POST /api/auth/send-login-2fa-code
 *
 * Sendet einen 2FA-E-Mail-Code für den Login (User hat Passwort bereits bestätigt).
 * Body: { email }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || "").toLowerCase().trim()
    if (!email) {
      return NextResponse.json({ error: "E-Mail erforderlich" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        totpEnabled: true,
        twoFactorMethod: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Kein Konto mit dieser E-Mail-Adresse gefunden." },
        { status: 404 }
      )
    }

    if (!user.totpEnabled || user.twoFactorMethod !== "email") {
      return NextResponse.json(
        { error: "2FA per E-Mail ist für dieses Konto nicht aktiviert." },
        { status: 400 }
      )
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
      message: "Ein Code wurde an Ihre E-Mail-Adresse gesendet.",
      expiresInMinutes: CODE_EXPIRY_MINUTES,
    }, { status: 200 })
  } catch (e: any) {
    console.error("[send-login-2fa-code]", e)
    return NextResponse.json(
      { error: e?.message || "Code konnte nicht gesendet werden." },
      { status: 500 }
    )
  }
}
