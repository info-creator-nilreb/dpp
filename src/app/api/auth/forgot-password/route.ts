import { NextResponse } from "next/server"
import { requestPasswordReset } from "@/lib/password-reset"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/forgot-password
 * 
 * Sendet einen Passwort-Reset-Link an die angegebene E-Mail-Adresse
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-Mail-Adresse ist erforderlich" },
        { status: 400 }
      )
    }

    const result = await requestPasswordReset(email)
    console.log("Password reset result:", result)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, error: result.message },
        { status: 500 }
      )
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error("Error in forgot-password route:", error)
    console.error("Error type:", typeof error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    // Gib mehr Details zurück für besseres Debugging
    const errorMessage = error?.message || "Ein Fehler ist aufgetreten"
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage, 
        message: errorMessage,
        // Nur im Development-Mode mehr Details
        ...(process.env.NODE_ENV === "development" && { details: error?.stack })
      },
      { status: 500 }
    )
  }
}

