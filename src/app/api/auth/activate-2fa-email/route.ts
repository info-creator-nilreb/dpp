import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/activate-2fa-email
 *
 * Aktiviert 2FA per E-Mail: Code verifizieren und twoFactorMethod = email setzen.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const code = String(body?.code || "").trim()
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Bitte geben Sie den 6-stelligen Code aus der E-Mail ein." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email2FACodeHash: true,
        email2FACodeExpiresAt: true,
      },
    })

    if (!user?.email2FACodeHash || !user.email2FACodeExpiresAt) {
      return NextResponse.json(
        { error: "Kein gültiger Code angefordert. Bitte zuerst einen Code anfordern." },
        { status: 400 }
      )
    }

    if (new Date() > user.email2FACodeExpiresAt) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { email2FACodeHash: null, email2FACodeExpiresAt: null },
      })
      return NextResponse.json(
        { error: "Der Code ist abgelaufen. Bitte fordern Sie einen neuen Code an." },
        { status: 400 }
      )
    }

    const valid = await bcrypt.compare(code, user.email2FACodeHash)
    if (!valid) {
      return NextResponse.json(
        { error: "Ungültiger Code. Bitte prüfen Sie die E-Mail und versuchen Sie es erneut." },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpEnabled: true,
        twoFactorMethod: "email",
        totpSecret: null,
        email2FACodeHash: null,
        email2FACodeExpiresAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Zwei-Faktor-Authentifizierung per E-Mail wurde aktiviert.",
    }, { status: 200 })
  } catch (e: any) {
    console.error("[activate-2fa-email]", e)
    return NextResponse.json(
      { error: e?.message || "Aktivierung fehlgeschlagen." },
      { status: 500 }
    )
  }
}
