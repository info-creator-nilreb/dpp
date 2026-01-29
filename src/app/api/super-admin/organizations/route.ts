/**
 * SUPER ADMIN ORGANIZATIONS API
 * 
 * CRUD operations for organizations
 * Requires: support_admin or super_admin role
 */

import { NextResponse } from "next/server"
import { requireSuperAdminPermissionApiThrow } from "@/lib/super-admin-guards"
import { getClientIp, getClientUserAgent } from "@/lib/super-admin-audit"
import { logSuperAdminOrganizationCreation } from "@/lib/phase1.5/super-admin-audit"
import { createOrganizationWithFirstUser } from "@/lib/phase1/organization"
import { PHASE1_ROLES } from "@/lib/phase1/roles"
import { sendInvitationEmail } from "@/lib/email"
import { createInvitation } from "@/lib/phase1/invitations"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: List all organizations
export async function GET(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "read")
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const licenseTier = searchParams.get("licenseTier")
    const search = searchParams.get("search")

    const where: any = {}
    if (status) where.status = status
    if (licenseTier) where.licenseTier = licenseTier
    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            memberships: true,
            dpps: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ organizations })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORGS] GET error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Organisationen" },
      { status: 500 }
    )
  }
}

// POST: Create new organization (Phase 1.5)
export async function POST(request: Request) {
  try {
    const session = await requireSuperAdminPermissionApiThrow("organization", "update")
    if (session instanceof NextResponse) {
      return session
    }

    const body = await request.json()
    const { 
      name,
      legalName,
      country,
      adminEmail,
      adminFirstName,
      adminLastName,
      licenseTier = "free",
    } = body

    // Phase 1.5: Required fields
    if (!name || !legalName || !country || !adminEmail) {
      return NextResponse.json(
        { error: "Name, rechtlicher Name, Land und Admin-E-Mail sind erforderlich" },
        { status: 400 }
      )
    }

    // Validate license tier
    const validTiers = ["free", "basic", "premium", "pro"]
    if (!validTiers.includes(licenseTier)) {
      return NextResponse.json(
        { error: "Ungültiger License Tier" },
        { status: 400 }
      )
    }

    // Prüfe ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase().trim() },
    })

    let invitationSent = false
    let tempPassword: string | undefined

    // Generiere temporäres Passwort falls User nicht existiert
    if (!existingUser) {
      tempPassword = Math.random().toString(36).slice(-12) + "A1!"
    }

    // Erstelle Organisation mit E-Mail als erstem Nutzer
    // createOrganizationWithFirstUser erstellt den User automatisch oder verwendet existierenden
    const result = await createOrganizationWithFirstUser(
      adminEmail,
      name.trim(),
      {
        firstName: adminFirstName || undefined,
        lastName: adminLastName || undefined,
        password: tempPassword, // Nur gesetzt wenn User neu erstellt wird
      }
    )

    const organizationId = result.organizationId
    const userId = result.userId

    // Aktualisiere zusätzliche Organisationsfelder
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        legalName: legalName.trim(),
        country: country.trim(),
        licenseTier,
      },
    })

    // Send invitation email if user doesn't exist or is invited
    if (!existingUser || existingUser.status === "invited") {
      try {
        const invitation = await createInvitation(
          adminEmail,
          organizationId,
          PHASE1_ROLES.ORG_ADMIN,
          session.id // Super Admin as inviter
        )

        await sendInvitationEmail(
          adminEmail,
          organizationId,
          invitation.token
        )
        invitationSent = true
      } catch (emailError) {
        console.error("[SUPER_ADMIN_ORGS] Failed to send invitation email:", emailError)
        // Continue even if email fails
      }
    }

    // Lade Organisation für Audit Log
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    // Phase 1.5: Enhanced audit log
    await logSuperAdminOrganizationCreation(
      session.id,
      organizationId,
      {
        name: organization?.name || name.trim(),
        legalName: organization?.legalName || legalName.trim(),
        country: organization?.country || country.trim(),
        licenseTier: organization?.licenseTier || licenseTier,
        adminEmail,
        invitationSent,
      },
      getClientIp(request),
      getClientUserAgent(request)
    )

    const organizationWithDetails = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            dpps: true
          }
        }
      }
    })

    return NextResponse.json({ 
      organization: organizationWithDetails,
      invitationSent,
    })
  } catch (error: any) {
    console.error("[SUPER_ADMIN_ORGS] POST error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen der Organisation" },
      { status: 500 }
    )
  }
}

