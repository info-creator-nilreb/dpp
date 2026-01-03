import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  canViewDPP,
  canEditDPP,
  canEditSection,
  canManageOrganization,
  isSuperAdmin,
} from "@/lib/permissions"
import { DPP_SECTIONS, type DppSection } from "@/lib/dpp-sections"

/**
 * API Permission Helpers
 * 
 * Vereinfachen Permission-Checks in API-Routen
 */

/**
 * Prüft ob User einen DPP ansehen kann
 * Gibt 403 Response zurück wenn nicht autorisiert
 */
export async function requireViewDPP(
  dppId: string,
  userId?: string
): Promise<NextResponse | null> {
  if (!userId) {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    userId = session.user.id
  }

  const canView = await canViewDPP(userId, dppId)
  if (!canView) {
    return NextResponse.json(
      { error: "Kein Zugriff auf diesen DPP" },
      { status: 403 }
    )
  }

  return null
}

/**
 * Prüft ob User einen DPP bearbeiten kann
 * Gibt 403 Response zurück wenn nicht autorisiert
 */
export async function requireEditDPP(
  dppId: string,
  userId?: string
): Promise<NextResponse | null> {
  if (!userId) {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    userId = session.user.id
  }

  const canEdit = await canEditDPP(userId, dppId)
  if (!canEdit) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Bearbeiten dieses DPPs" },
      { status: 403 }
    )
  }

  return null
}

/**
 * Prüft ob User eine bestimmte Sektion bearbeiten kann
 * Gibt 403 Response zurück wenn nicht autorisiert
 */
export async function requireEditSection(
  dppId: string,
  section: DppSection,
  userId?: string
): Promise<NextResponse | null> {
  if (!userId) {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    userId = session.user.id
  }

  const canEdit = await canEditSection(userId, dppId, section)
  if (!canEdit) {
    return NextResponse.json(
      { error: `Keine Berechtigung zum Bearbeiten der Sektion: ${section}` },
      { status: 403 }
    )
  }

  return null
}

/**
 * Prüft ob User eine Organisation verwalten kann
 * Gibt 403 Response zurück wenn nicht autorisiert
 */
export async function requireManageOrganization(
  organizationId: string,
  userId?: string
): Promise<NextResponse | null> {
  if (!userId) {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    userId = session.user.id
  }

  const canManage = await canManageOrganization(userId, organizationId)
  if (!canManage) {
    return NextResponse.json(
      { error: "Keine Berechtigung zur Verwaltung dieser Organisation" },
      { status: 403 }
    )
  }

  return null
}

/**
 * Helper: Map DPP-Felder zu Sektionen
 */
export function getSectionForField(field: string): DppSection | null {
  const fieldToSection: Record<string, DppSection> = {
    // Basis-Daten
    name: DPP_SECTIONS.BASIC_DATA,
    description: DPP_SECTIONS.BASIC_DATA,
    category: DPP_SECTIONS.BASIC_DATA,
    sku: DPP_SECTIONS.BASIC_DATA,
    gtin: DPP_SECTIONS.BASIC_DATA,
    brand: DPP_SECTIONS.BASIC_DATA,
    countryOfOrigin: DPP_SECTIONS.BASIC_DATA,
    
    // Materialien
    materials: DPP_SECTIONS.MATERIALS,
    materialSource: DPP_SECTIONS.MATERIAL_SOURCE,
    
    // Pflege & Reparatur
    careInstructions: DPP_SECTIONS.CARE,
    isRepairable: DPP_SECTIONS.REPAIR,
    sparePartsAvailable: DPP_SECTIONS.REPAIR,
    lifespan: DPP_SECTIONS.LIFESPAN,
    
    // Rechtliches
    conformityDeclaration: DPP_SECTIONS.CONFORMITY,
    disposalInfo: DPP_SECTIONS.DISPOSAL,
    
    // Rücknahme & Second Life
    takebackOffered: DPP_SECTIONS.TAKEBACK,
    takebackContact: DPP_SECTIONS.TAKEBACK,
    secondLifeInfo: DPP_SECTIONS.SECOND_LIFE,
  }

  return fieldToSection[field] || null
}

