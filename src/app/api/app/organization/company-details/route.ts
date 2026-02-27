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
import { logCompanyDetailsUpdated, logOrganizationUpdated } from "@/lib/phase1/audit"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"

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

    const canEdit = await canEditOrganization(session.user.id, user.organizationId)

    const context: CapabilityContext = {
      organizationId: user.organizationId,
      userId: session.user.id,
    }
    const hasCmsStyling = await hasFeature("cms_styling", context)

    const companyDetailsPayload: Record<string, unknown> = {
      legalName: organization.legalName,
      companyType: organization.companyType,
      vatId: organization.vatId,
      eori: organization.eori,
      commercialRegisterId: organization.commercialRegisterId,
      registrationCountry: organization.registrationCountry,
      addressStreet: organization.addressStreet,
      addressZip: organization.addressZip,
      addressCity: organization.addressCity,
      addressCountry: organization.addressCountry,
      country: organization.country,
      socialInstagram: organization.socialInstagram ?? null,
      socialFacebook: organization.socialFacebook ?? null,
      socialTiktok: organization.socialTiktok ?? null,
      socialPinterest: organization.socialPinterest ?? null,
      socialYoutube: organization.socialYoutube ?? null,
      socialLinkedin: organization.socialLinkedin ?? null,
    }
    if (hasCmsStyling) {
      companyDetailsPayload.defaultStyling = (organization as any).defaultStyling ?? null
    }

    return NextResponse.json(
      {
        organization: {
          name: organization.name,
          status: organization.status,
          createdAt: organization.createdAt.toISOString(),
          canEdit,
        },
        hasCmsStyling,
        companyDetails: companyDetailsPayload,
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
      name: nameInput,
      legalName,
      companyType,
      vatId,
      eori,
      commercialRegisterId,
      registrationCountry: registrationCountryInput,
      addressStreet,
      addressZip,
      addressCity,
      addressCountry,
      country,
      socialInstagram,
      socialFacebook,
      socialTiktok,
      socialPinterest,
      socialYoutube,
      socialLinkedin,
      defaultStyling: defaultStylingInput,
    } = body

    // registration_country immer setzen: explizit oder Fallback auf Adressland (ISO-2)
    const countryVal = country != null ? String(country).trim() : ""
    const registrationCountryVal = registrationCountryInput != null ? String(registrationCountryInput).trim() : ""
    const registrationCountry = registrationCountryVal !== "" ? registrationCountryVal : (countryVal !== "" ? countryVal : null)

    // Hole aktuelle Organisation für Audit Logs
    const currentOrg = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        name: true,
        legalName: true,
        companyType: true,
        vatId: true,
        eori: true,
        commercialRegisterId: true,
        registrationCountry: true,
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

    const actorRole = await getUserRole(session.user.id, user.organizationId)

    const context: CapabilityContext = {
      organizationId: user.organizationId,
      userId: session.user.id,
    }
    const hasCmsStyling = await hasFeature("cms_styling", context)

    // Optional: Organisationsname aktualisieren (aus ehem. Allgemeine Einstellungen)
    if (nameInput !== undefined) {
      const name = typeof nameInput === "string" ? nameInput.trim() : ""
      if (!name) {
        return NextResponse.json(
          { error: "Organisationsname ist erforderlich" },
          { status: 400 }
        )
      }
      if (currentOrg.name !== name) {
        await prisma.organization.update({
          where: { id: user.organizationId },
          data: { name },
        })
        await logOrganizationUpdated(
          session.user.id,
          user.organizationId,
          actorRole || "ORG_ADMIN",
          "name",
          currentOrg.name,
          name
        )
      }
    }

    // Aktualisiere Company Details (registration_country immer gesetzt, Fallback Adressland)
    const companyDetailsUpdate: Parameters<typeof updateCompanyDetails>[1] = {
      legalName,
      companyType,
      vatId,
      eori,
      commercialRegisterId,
      registrationCountry: registrationCountry ?? undefined,
      addressStreet,
      addressZip,
      addressCity,
      addressCountry,
      country: countryVal ?? undefined,
      socialInstagram: socialInstagram !== undefined ? (socialInstagram === "" ? null : socialInstagram) : undefined,
      socialFacebook: socialFacebook !== undefined ? (socialFacebook === "" ? null : socialFacebook) : undefined,
      socialTiktok: socialTiktok !== undefined ? (socialTiktok === "" ? null : socialTiktok) : undefined,
      socialPinterest: socialPinterest !== undefined ? (socialPinterest === "" ? null : socialPinterest) : undefined,
      socialYoutube: socialYoutube !== undefined ? (socialYoutube === "" ? null : socialYoutube) : undefined,
      socialLinkedin: socialLinkedin !== undefined ? (socialLinkedin === "" ? null : socialLinkedin) : undefined,
    }
    if (hasCmsStyling && defaultStylingInput !== undefined) {
      companyDetailsUpdate.defaultStyling =
        defaultStylingInput === null || defaultStylingInput === ""
          ? null
          : (typeof defaultStylingInput === "object" && defaultStylingInput !== null ? defaultStylingInput : null)
    }
    await updateCompanyDetails(user.organizationId, companyDetailsUpdate)

    // Audit Log für Firmendaten
    await logCompanyDetailsUpdated(
      user.organizationId,
      session.user.id,
      actorRole || "ORG_ADMIN",
      currentOrg,
      {
        legalName,
        companyType,
        vatId,
        eori,
        commercialRegisterId,
        registrationCountry,
        addressStreet,
        addressZip,
        addressCity,
        addressCountry,
        country: countryVal || null,
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

