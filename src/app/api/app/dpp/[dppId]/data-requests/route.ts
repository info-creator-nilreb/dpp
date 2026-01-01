export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireEditDPP } from "@/lib/api-permissions"
import { generateVerificationToken } from "@/lib/email"
import { sendSupplierDataRequestEmail } from "@/lib/email"
import { getOrganizationRole } from "@/lib/permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"
import { DPP_SECTIONS } from "@/lib/permissions"

/**
 * POST /api/app/dpp/[dppId]/data-requests
 * 
 * Erstellt einen Data Request für einen Partner/Lieferanten
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

    const { email, partnerRole, sections, message } = await request.json()

    // Validierung
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "E-Mail-Adresse ist erforderlich" },
        { status: 400 }
      )
    }

    if (!partnerRole) {
      return NextResponse.json(
        { error: "Partner-Rolle ist erforderlich" },
        { status: 400 }
      )
    }

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: "Mindestens eine Sektion muss ausgewählt werden" },
        { status: 400 }
      )
    }

    // Hole DPP mit Organisation
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

    // Generiere Token
    const token = generateVerificationToken()

    // Token ist 14 Tage gültig
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    // Erstelle Contributor Token
    const contributorToken = await prisma.contributorToken.create({
      data: {
        token,
        dppId: params.dppId,
        email: email.toLowerCase().trim(),
        partnerRole,
        sections: sections.join(","),
        message: message?.trim() || null,
        status: "pending",
        expiresAt,
        requestedBy: session.user.id,
      },
    })

    // Generiere Magic Link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    const contributeUrl = `${baseUrl}/contribute/${token}`

    // Sende E-Mail
    try {
      await sendSupplierDataRequestEmail(email, {
        organizationName: dpp.organization.name,
        productName: dpp.name,
        partnerRole,
        contributeUrl,
      })
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      // Token wurde bereits erstellt, also loggen wir den Fehler, aber löschen den Token nicht
      // Der User kann den Link manuell kopieren, falls die E-Mail fehlschlägt
    }

    // Audit Log
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, dpp.organizationId)

    await logDppAction(ACTION_TYPES.CREATE, params.dppId, {
      actorId: session.user.id,
      actorRole: role || undefined,
      organizationId: dpp.organizationId,
      source: SOURCES.UI,
      complianceRelevant: false,
      ipAddress,
      metadata: {
        entityType: "CONTRIBUTOR_TOKEN",
        entityId: contributorToken.id,
        partnerRole,
        sections: sections.join(","),
      },
    })

    return NextResponse.json({
      success: true,
      tokenId: contributorToken.id,
      contributeUrl, // Für Development/Testing
    })
  } catch (error) {
    console.error("Error creating data request:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/app/dpp/[dppId]/data-requests
 * 
 * Holt alle Data Requests für einen DPP
 */
export async function GET(
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

    // Prüfe Berechtigung zum Ansehen
    const permissionError = await requireEditDPP(params.dppId, session.user.id)
    if (permissionError) return permissionError

    // Hole alle Contributor Tokens für diesen DPP
    const tokens = await prisma.contributorToken.findMany({
      where: { dppId: params.dppId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        partnerRole: true,
        sections: true,
        status: true,
        expiresAt: true,
        submittedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      requests: tokens.map((token) => ({
        id: token.id,
        email: token.email,
        partnerRole: token.partnerRole,
        sections: token.sections.split(","),
        status: token.status,
        expiresAt: token.expiresAt,
        submittedAt: token.submittedAt,
        createdAt: token.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching data requests:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

