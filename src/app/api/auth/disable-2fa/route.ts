import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { verifyTotpCode } from "@/lib/totp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/disable-2fa
 *
 * Deaktiviert 2FA nach Bestätigung mit Passwort und aktuellem 2FA-Code.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { password, code } = body
    if (!password || !code) {
      return NextResponse.json(
        { error: "Passwort und 2FA-Code sind erforderlich" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        totpEnabled: true,
        totpSecret: true,
        twoFactorMethod: true,
        email2FACodeHash: true,
        email2FACodeExpiresAt: true,
      },
    })

    if (!user || !user.totpEnabled) {
      return NextResponse.json(
        { error: "2FA ist nicht aktiviert" },
        { status: 400 }
      )
    }

    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Aktuelles Passwort ist falsch" },
        { status: 401 }
      )
    }

    const method = user.twoFactorMethod || "totp"
    if (method === "totp" && user.totpSecret) {
      const codeValid = verifyTotpCode(String(code).trim().replace(/\D/g, ""), user.totpSecret)
      if (!codeValid) {
        return NextResponse.json(
          { error: "Ungültiger 2FA-Code. Bitte den aktuellen Code aus der App verwenden." },
          { status: 400 }
        )
      }
    } else if (method === "email" && user.email2FACodeHash && user.email2FACodeExpiresAt) {
      if (new Date() > user.email2FACodeExpiresAt) {
        return NextResponse.json(
          { error: "Der E-Mail-Code ist abgelaufen. Bitte einen neuen anfordern." },
          { status: 400 }
        )
      }
      const codeValid = await bcrypt.compare(String(code).trim(), user.email2FACodeHash)
      if (!codeValid) {
        return NextResponse.json(
          { error: "Ungültiger E-Mail-Code." },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "2FA kann derzeit nicht verifiziert werden." },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        twoFactorMethod: null,
        email2FACodeHash: null,
        email2FACodeExpiresAt: null,
      },
    })

    return NextResponse.json(
      { success: true, message: "2FA wurde deaktiviert" },
      { status: 200 }
    )
  } catch (err) {
    console.error("[disable-2fa]", err)
    const message = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
