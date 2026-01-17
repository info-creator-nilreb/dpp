export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { sendSupplierDataRequestEmail } from "@/lib/email"

/**
 * POST /api/app/dpp/[dppId]/data-requests/send-pending
 * 
 * Versendet E-Mails an alle pending Invites ohne emailSentAt
 */
export async function POST(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe Berechtigung zum Bearbeiten
    const permissionError = await requireEditDPP(params.dppId, session.user.id)
    if (permissionError) return permissionError

    // Hole DPP mit Organization-Info
    const dpp = await prisma.dpp.findUnique({
      where: { id: params.dppId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Hole alle pending Invites ohne emailSentAt
    const pendingTokens = await prisma.contributorToken.findMany({
      where: {
        dppId: params.dppId,
        status: "pending",
        emailSentAt: null,
      },
      select: {
        id: true,
        token: true,
        email: true,
        partnerRole: true,
      },
    })

    if (pendingTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine ausstehenden Einladungen gefunden",
        sentCount: 0,
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Versende E-Mails an alle pending Invites
    for (const token of pendingTokens) {
      try {
        const contributeUrl = `${baseUrl}/contribute/${token.token}`
        await sendSupplierDataRequestEmail(token.email, {
          organizationName: dpp.organization.name,
          productName: dpp.name,
          partnerRole: token.partnerRole || "Partner",
          contributeUrl,
        })

        // Aktualisiere emailSentAt
        await prisma.contributorToken.update({
          where: { id: token.id },
          data: { emailSentAt: new Date() },
        })

        successCount++
      } catch (error: any) {
        errorCount++
        errors.push(`${token.email}: ${error.message || "Unbekannter Fehler"}`)
        console.error(`[DATA_REQUESTS_SEND_PENDING] Fehler beim Versenden an ${token.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount} von ${pendingTokens.length} E-Mail${pendingTokens.length > 1 ? "s" : ""} erfolgreich versendet`,
      sentCount: successCount,
      totalCount: pendingTokens.length,
      ...(errorCount > 0 && { errors }),
    })
  } catch (error: any) {
    console.error("[DATA_REQUESTS_SEND_PENDING] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

