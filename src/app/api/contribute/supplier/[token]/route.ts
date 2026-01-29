export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/contribute/supplier/[token]
 *
 * Validiert einen Supplier-Invite-Token und gibt Kontext für die Beitragsseite zurück.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params
    const token = resolvedParams.token

    if (!token) {
      return NextResponse.json({ error: "Token ist erforderlich" }, { status: 400 })
    }

    const invite = await prisma.dppSupplierInvite.findFirst({
      where: { token, status: "pending" },
      include: {
        dpp: {
          include: {
            organization: { select: { name: true } },
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Link" },
        { status: 404 }
      )
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Dieser Einladungslink ist abgelaufen" },
        { status: 410 }
      )
    }

    return NextResponse.json({
      token: invite.token,
      email: invite.email,
      partnerRole: invite.partnerRole,
      blockIds: (invite.blockIds as string[]) || [],
      fieldInstances: (invite.fieldInstances as unknown[]) || [],
      supplierMode: invite.supplierMode,
      message: invite.message,
      dpp: {
        id: invite.dpp.id,
        name: invite.dpp.name,
        organizationName: invite.dpp.organization.name,
      },
    })
  } catch (error: any) {
    console.error("Error loading supplier invite:", error)
    return NextResponse.json(
      { error: error?.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
