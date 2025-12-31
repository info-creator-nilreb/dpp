/**
 * Phase 1: Organization Company Details API
 * 
 * GET /api/app/organization/company-details - Holt Company Details
 * PUT /api/app/organization/company-details - Aktualisiert Company Details
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateCompanyDetails, getOrganizationWithDetails } from "@/lib/phase1/organization"
import { canEditOrganization, getUserRole } from "@/lib/phase1/permissions"
import { logCompanyDetailsUpdated } from "@/lib/phase1/audit"

/**
 * GET /api/app/organization/company-details
 * 
 * Holt Company Details der Organisation
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    const organization = await getOrganizationWithDetails(user.organizationId)

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        companyDetails: {
          legalName: organization.legalName,
          companyType: organization.companyType,
          vatId: organization.vatId,
          commercialRegisterId: organization.commercialRegisterId,
          addressStreet: organization.addressStreet,
          addressZip: organization.addressZip,
          addressCity: organization.addressCity,
          addressCountry: organization.addressCountry,
          country: organization.country,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[COMPANY_DETAILS_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/organization/company-details
 * 
 * Aktualisiert Company Details
 * Body: { legalName?, companyType?, vatId?, commercialRegisterId?, addressStreet?, addressZip?, addressCity?, addressCountry?, country? }
 */
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Keine Organisation zugeordnet" },
        { status: 400 }
      )
    }

    // Permission-Check: Nur ORG_ADMIN kann Company Details bearbeiten
    if (!(await canEditOrganization(session.user.id, user.organizationId))) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Bearbeiten der Organisationsdaten" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      legalName,
      companyType,
      vatId,
      commercialRegisterId,
      addressStreet,
      addressZip,
      addressCity,
      addressCountry,
      country,
    } = body

    // Hole aktuelles Profil für Audit Log
    const currentOrg = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        legalName: true,
        companyType: true,
        vatId: true,
        commercialRegisterId: true,
        addressStreet: true,
        addressZip: true,
        addressCity: true,
        addressCountry: true,
        country: true,
      },
    })

    if (!currentOrg) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Aktualisiere Company Details
    await updateCompanyDetails(user.organizationId, {
      legalName,
      companyType,
      vatId,
      commercialRegisterId,
      addressStreet,
      addressZip,
      addressCity,
      addressCountry,
      country,
    })

    // Hole Rolle für Audit Log
    const actorRole = await getUserRole(session.user.id, user.organizationId)

    // Audit Log
    await logCompanyDetailsUpdated(
      user.organizationId,
      session.user.id,
      actorRole || "ORG_ADMIN",
      currentOrg,
      {
        legalName,
        companyType,
        vatId,
        commercialRegisterId,
        addressStreet,
        addressZip,
        addressCity,
        addressCountry,
        country,
      }
    )

    return NextResponse.json(
      { success: true, message: "Company Details erfolgreich aktualisiert" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[COMPANY_DETAILS_PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

