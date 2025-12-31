export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getUserRole, isOrgAdmin } from "@/lib/phase1/permissions"
import { logOrganizationUpdated } from "@/lib/phase1/audit"

/**
 * GET /api/app/organization/general
 * 
 * Holt allgemeine Organisationsdaten (Name, Status, Erstellungsdatum)
 * Prüft Zugriffsrechte: ORG_ADMIN kann editieren, andere nur lesen
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

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Prüfe ob User ORG_ADMIN ist
    const canEdit = await isOrgAdmin(session.user.id, user.organizationId)
    const role = await getUserRole(session.user.id, user.organizationId)

    return NextResponse.json({
      organization: {
        ...organization,
        createdAt: organization.createdAt.toISOString(),
        role,
        canEdit,
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error("[ORGANIZATION_GENERAL_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app/organization/general
 * 
 * Aktualisiert Organisationsname
 * Nur ORG_ADMIN kann Änderungen vornehmen
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

    // Prüfe ob User ORG_ADMIN ist
    const canEdit = await isOrgAdmin(session.user.id, user.organizationId)
    if (!canEdit) {
      return NextResponse.json(
        { error: "Nur Organisations-Administratoren können Änderungen vornehmen" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Organisationsname ist erforderlich" },
        { status: 400 }
      )
    }

    // Hole aktuelle Organisation für Audit Log
    const currentOrganization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    })

    if (!currentOrganization) {
      return NextResponse.json(
        { error: "Organisation nicht gefunden" },
        { status: 404 }
      )
    }

    // Aktualisiere Organisation
    const updatedOrganization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    })

    // Audit Log
    if (currentOrganization.name !== name.trim()) {
      const role = await getUserRole(session.user.id, user.organizationId)
      await logOrganizationUpdated(
        session.user.id,
        user.organizationId,
        role || "ORG_ADMIN",
        "name",
        currentOrganization.name,
        name.trim()
      )
    }

    return NextResponse.json({
      organization: {
        ...updatedOrganization,
        createdAt: updatedOrganization.createdAt.toISOString(),
        role: "ORG_ADMIN",
        canEdit: true,
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error("[ORGANIZATION_GENERAL_PUT] Error:", error)
    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

