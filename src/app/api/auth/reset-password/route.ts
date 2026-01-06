import { NextResponse } from "next/server"
import { resetPassword } from "@/lib/password-reset"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/reseeasy-password
 * 
 * Setzt das Passwort mit einem Reset-Token zurück
 */
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    console.log("Reset password request received:", { token: token?.substring(0, 20) + "...", passwordLength: password?.length })

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Reset-Token ist erforderlich", message: "Reset-Token ist erforderlich" },
        { status: 400 }
      )
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Passwort muss mindestens 8 Zeichen lang sein", message: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      )
    }

    const result = await resetPassword(token, password)
    console.log("Reset password result:", result)

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error: any) {
    console.error("Error in reseeasy-password route:", error)
    console.error("Error stack:", error?.stack)
    return NextResponse.json(
      { success: false, error: "Ein Fehler ist aufgetreten", message: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

