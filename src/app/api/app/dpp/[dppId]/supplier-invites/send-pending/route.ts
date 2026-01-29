export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { sendSupplierDataRequestEmail } from "@/lib/email"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"

/**
 * POST /api/app/dpp/[dppId]/supplier-invites/send-pending
 *
 * Versendet E-Mails an alle pending Einladungen, die noch keine E-Mail erhalten haben.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const permissionError = await requireEditDPP(resolvedParams.dppId, session.user.id)
    if (permissionError) return permissionError

    const dpp = await prisma.dpp.findUnique({
      where: { id: resolvedParams.dppId },
      include: { organization: { select: { name: true } } },
    })
    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

    const pending = await prisma.dppSupplierInvite.findMany({
      where: {
        dppId: resolvedParams.dppId,
        status: "pending",
        emailSentAt: null,
        token: { not: null },
      },
    })

    for (const inv of pending) {
      if (!inv.token) continue
      const contributeUrl = `${baseUrl}/contribute/supplier/${inv.token}`
      try {
        await sendSupplierDataRequestEmail(inv.email, {
          organizationName: dpp.organization.name,
          productName: dpp.name,
          partnerRole: inv.partnerRole,
          contributeUrl,
        })
        await prisma.dppSupplierInvite.update({
          where: { id: inv.id },
          data: { emailSentAt: new Date() },
        })
      } catch (emailError) {
        console.error("Error sending invite email to", inv.email, emailError)
      }
    }

    return NextResponse.json({ sent: pending.length })
  } catch (error: any) {
    console.error("Error sending pending invites:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
