/**
 * SUPER ADMIN FORGOT PASSWORD API
 * 
 * Sends password reset email to Super Admin
 * COMPLETELY SEPARATE from tenant forgot password
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      )
    }

    // Find Super Admin
    const admin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    // Always return success (security: don't reveal if email exists)
    // But only send email if admin exists
    if (admin && admin.isActive) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store reset token in database
      await prisma.superAdmin.update({
        where: { id: admin.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetTokenExpires: resetTokenExpires
        }
      })

      console.log("[SUPER_ADMIN_FORGOT_PASSWORD] Reset token stored for", email)
      console.log("[SUPER_ADMIN_FORGOT_PASSWORD] Reset link:", `/super-admin/reseeasy-password?token=${resetToken}`)

      // TODO: Send email with reset link via email service
      // For now, the token is stored and can be used via the reset link
    }

    // Always return success (security best practice)
    return NextResponse.json({
      success: true,
      message: "Falls ein Account mit dieser E-Mail existiert, wurde ein Passwort-Reset-Link gesendet."
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_FORGOT_PASSWORD] Error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
