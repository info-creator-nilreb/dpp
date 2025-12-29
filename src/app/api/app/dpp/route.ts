export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ORGANIZATION_ROLES, getOrganizationRole } from "@/lib/permissions"
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getClientIp } from "@/lib/audit/get-client-ip"

/**
 * POST /api/app/dpp
 * 
 * Erstellt einen neuen DPP
 * - Prüft Berechtigung (User muss Mitglied der Organization sein)
 * - Erstellt DPP in DB
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    // Explizite Validierung: session.user.id muss existieren
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Hole zuerst die Organisation des Users
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Wenn keine Organisation vorhanden → 400 mit klarem Fehler
    if (!membership || !membership.organization) {
      return NextResponse.json(
        { error: "NO_ORGANIZATION" },
        { status: 400 }
      )
    }

    // Prüfe ob User DPPs erstellen darf (ORG_VIEWER darf keine erstellen)
    const role = membership.role as string
    if (role === ORGANIZATION_ROLES.ORG_VIEWER) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Erstellen von DPPs" },
        { status: 403 }
      )
    }

    const resolvedOrganizationId = membership.organization.id
    console.log("DPP CREATE: resolved organizationId", resolvedOrganizationId)

    const {
      name, description, category, organizationId,
      sku, gtin, brand, countryOfOrigin,
      materials, materialSource,
      careInstructions, isRepairable, sparePartsAvailable, lifespan,
      conformityDeclaration, disposalInfo,
      takebackOffered, takebackContact, secondLifeInfo
    } = await request.json()

    // Validierung (Pflichtfelder)
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Produktname ist erforderlich" },
        { status: 400 }
      )
    }

    if (!category || !["TEXTILE", "FURNITURE", "OTHER"].includes(category)) {
      return NextResponse.json(
        { error: "Produktkategorie ist erforderlich" },
        { status: 400 }
      )
    }

    if (!sku || typeof sku !== "string" || sku.trim().length === 0) {
      return NextResponse.json(
        { error: "SKU / Interne ID ist erforderlich" },
        { status: 400 }
      )
    }

    if (!brand || typeof brand !== "string" || brand.trim().length === 0) {
      return NextResponse.json(
        { error: "Marke / Hersteller ist erforderlich" },
        { status: 400 }
      )
    }

    if (!countryOfOrigin || typeof countryOfOrigin !== "string" || countryOfOrigin.trim().length === 0) {
      return NextResponse.json(
        { error: "Herstellungsland ist erforderlich" },
        { status: 400 }
      )
    }

    // Verwende die aufgelöste organizationId (ignoriere organizationId aus Request, falls vorhanden)
    // organizationId wird explizit gesetzt

    // DPP erstellen - organizationId wird explizit gesetzt
    const dpp = await prisma.dpp.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category as "TEXTILE" | "FURNITURE" | "OTHER",
        sku: sku.trim(),
        gtin: gtin?.trim() || null,
        brand: brand.trim(),
        countryOfOrigin: countryOfOrigin.trim(),
        materials: materials?.trim() || null,
        materialSource: materialSource?.trim() || null,
        careInstructions: careInstructions?.trim() || null,
        isRepairable: isRepairable || null,
        sparePartsAvailable: sparePartsAvailable || null,
        lifespan: lifespan?.trim() || null,
        conformityDeclaration: conformityDeclaration?.trim() || null,
        disposalInfo: disposalInfo?.trim() || null,
        takebackOffered: takebackOffered || null,
        takebackContact: takebackContact?.trim() || null,
        secondLifeInfo: secondLifeInfo?.trim() || null,
        status: "DRAFT",
        organizationId: resolvedOrganizationId // Explizit gesetzt
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log("DPP CREATED", dpp.id)

    // Audit Log: DPP erstellt
    const ipAddress = getClientIp(request)
    const role = await getOrganizationRole(session.user.id, resolvedOrganizationId)
    
    await logDppAction(ACTION_TYPES.CREATE, dpp.id, {
      actorId: session.user.id,
      actorRole: role || undefined,
      organizationId: resolvedOrganizationId,
      source: SOURCES.UI,
      complianceRelevant: true, // DPP-Erstellung ist compliance-relevant
      ipAddress,
    })

    return NextResponse.json(
      {
        message: "DPP erfolgreich erstellt",
        dpp: {
          id: dpp.id,
          name: dpp.name
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating DPP:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/app/dpp
 * 
 * Holt alle DPPs der Organizations, in denen der User Mitglied ist
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

    // Prüfe ob Super Admin (kann alle DPPs sehen)
    const { isSuperAdmin } = await import("@/lib/permissions")
    const isAdmin = await isSuperAdmin(session.user.id)

    if (isAdmin) {
      // Super Admin sieht alle DPPs
      const allDpps = await prisma.dpp.findMany({
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          media: {
            select: { id: true }
          }
        },
        orderBy: { updatedAt: "desc" }
      })

      const dpps = allDpps.map(dpp => ({
        id: dpp.id,
        name: dpp.name,
        description: dpp.description,
        organizationId: dpp.organizationId,
        organizationName: dpp.organization.name,
        mediaCount: dpp.media.length,
        createdAt: dpp.createdAt,
        updatedAt: dpp.updatedAt
      }))

      return NextResponse.json({ dpps }, { status: 200 })
    }

    // Normale User: Hole alle Organizations des Users
    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        organization: {
          include: {
            dpps: {
              include: {
                media: {
                  select: {
                    id: true
                  }
                }
              },
              orderBy: {
                updatedAt: "desc"
              }
            }
          }
        }
      }
    })

    // Sammle alle DPPs aus Organizations
    const orgDpps = memberships.flatMap(m => 
      m.organization.dpps.map(dpp => ({
        id: dpp.id,
        name: dpp.name,
        description: dpp.description,
        organizationId: dpp.organizationId,
        organizationName: m.organization.name,
        mediaCount: dpp.media.length,
        createdAt: dpp.createdAt,
        updatedAt: dpp.updatedAt
      }))
    )

    // Hole auch DPPs, auf die User externe Permissions hat (die nicht bereits in orgDpps sind)
    const orgDppIds = new Set(orgDpps.map(d => d.id))
    
    const externalPermissions = await prisma.dppPermission.findMany({
      where: { userId: session.user.id },
      include: {
        dpp: {
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            },
            media: { select: { id: true } }
          }
        }
      }
    })

    // Filtere DPPs mit externen Permissions (die nicht bereits in orgDpps sind)
    const { canViewDPP } = await import("@/lib/permissions")
    const externalDpps = await Promise.all(
      externalPermissions
        .filter(perm => !orgDppIds.has(perm.dppId))
        .map(async perm => {
          const canView = await canViewDPP(session.user.id, perm.dpp.id)
          if (!canView) return null
          return {
            id: perm.dpp.id,
            name: perm.dpp.name,
            description: perm.dpp.description,
            organizationId: perm.dpp.organizationId,
            organizationName: perm.dpp.organization.name,
            mediaCount: perm.dpp.media.length,
            createdAt: perm.dpp.createdAt,
            updatedAt: perm.dpp.updatedAt
          }
        })
    )

    const externalDppsFiltered = externalDpps.filter((dpp): dpp is NonNullable<typeof dpp> => dpp !== null)

    // Kombiniere beide Listen
    const dpps = [...orgDpps, ...externalDppsFiltered]

    return NextResponse.json({ dpps }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching DPPs:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

