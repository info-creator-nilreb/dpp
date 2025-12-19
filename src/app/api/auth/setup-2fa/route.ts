import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateTotpSecret, generateTotpUrl, generateTotpQrCode } from "@/lib/totp"
import { isSuperAdmin } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/auth/setup-2fa
 * 
 * Generiert ein neues TOTP-Secret und QR-Code für 2FA-Setup
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe ob User Super Admin ist
    const isAdmin = await isSuperAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Nur Super Admins können 2FA einrichten" },
        { status: 403 }
      )
    }

    // Generiere neues Secret
    const secret = generateTotpSecret()
    const otpUrl = generateTotpUrl(secret, session.user.email || "")
    const qrCode = await generateTotpQrCode(otpUrl)

    return NextResponse.json({
      secret,
      qrCode,
      otpUrl
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error setting up 2FA:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/setup-2fa
 * 
 * Aktiviert 2FA für einen Super Admin nach Verifizierung des Codes
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe ob User Super Admin ist
    const isAdmin = await isSuperAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Nur Super Admins können 2FA einrichten" },
        { status: 403 }
      )
    }

    const { secret, code } = await request.json()

    if (!secret || !code) {
      return NextResponse.json(
        { error: "Secret und Code sind erforderlich" },
        { status: 400 }
      )
    }

    // Verifiziere Code
    const { verifyTotpCode } = await import("@/lib/totp")
    const { authenticator } = await import("otplib")
    
    // Debug: Generiere aktuellen Code für Vergleich
    const currentGeneratedCode = authenticator.generate(secret)
    console.error("[SETUP-2FA] Code-Verifizierung:", {
      providedCode: code,
      codeLength: String(code).length,
      currentGeneratedCode,
      secretLength: secret.length,
      secretPrefix: secret.substring(0, 4) + "..."
    })
    
    const isValid = verifyTotpCode(code, secret)
    
    // Zusätzlich direkt testen (verifyTotpCode verwendet bereits window: 2)
    const isValidDirect = authenticator.check(String(code), secret)
    
    console.error("[SETUP-2FA] Verifizierung-Ergebnis:", {
      isValid,
      isValidDirect,
      providedCode: code,
      currentGeneratedCode
    })

    if (!isValid && !isValidDirect) {
      // Gebe Debug-Informationen zurück, damit der User sehen kann, was das Problem ist
      return NextResponse.json(
        { 
          error: "Ungültiger 2FA-Code. Bitte verwenden Sie den aktuellen Code aus Ihrer Authenticator-App.",
          debug: {
            providedCode: code,
            currentGeneratedCode: currentGeneratedCode,
            isValid,
            isValidDirect,
            hint: "Der eingegebene Code muss mit dem aktuell generierten Code übereinstimmen. Codes wechseln alle 30 Sekunden."
          }
        },
        { status: 400 }
      )
    }

    // Aktiviere 2FA in DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpSecret: secret,
        totpEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "2FA wurde erfolgreich aktiviert"
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error activating 2FA:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

