export const dynamic = "force-dynamic"

import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canEditOrganization } from "@/lib/phase1/permissions"
import { hasFeature, CapabilityContext } from "@/lib/capabilities/resolver"
import { validateStyling } from "@/lib/cms/validation"
import { StylingConfig } from "@/lib/cms/types"
import { defaultStylingConfig } from "@/lib/cms/schemas"

/**
 * POST /api/app/organization/apply-default-styling
 *
 * Übernimmt die aktuellen Organisations-Vorgaben (Logo + Farben) in alle DPPs
 * der Organisation. Überschreibt pro DPP nur Logo und Farben; Fonts/Spacing
 * bleiben unverändert.
 */
export async function POST() {
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

    const canEdit = await canEditOrganization(session.user.id, user.organizationId)
    if (!canEdit) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Bearbeiten der Organisation" },
        { status: 403 }
      )
    }

    const context: CapabilityContext = {
      organizationId: user.organizationId,
      userId: session.user.id,
    }
    const hasCmsStyling = await hasFeature("cms_styling", context)
    if (!hasCmsStyling) {
      return NextResponse.json(
        { error: "Styling-Feature für diese Organisation nicht verfügbar" },
        { status: 403 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { defaultStyling: true },
    })

    const raw = (organization?.defaultStyling as Record<string, unknown> | null) ?? null
    const orgLogo =
      raw && typeof raw === "object" && raw.logo && typeof raw.logo === "object"
        ? {
            url: String((raw.logo as Record<string, unknown>).url ?? ""),
            alt: (raw.logo as Record<string, unknown>).alt != null ? String((raw.logo as Record<string, unknown>).alt) : undefined,
          }
        : undefined
    const orgColors = raw && typeof raw === "object" && raw.colors && typeof raw.colors === "object" ? (raw.colors as Record<string, string>) : {}
    const defaultColors = defaultStylingConfig.colors as { primary: string; secondary?: string; accent?: string }
    const orgDefaultStyling: Pick<StylingConfig, "logo" | "colors"> = {
      logo: orgLogo?.url ? orgLogo : undefined,
      colors: {
        primary: orgColors.primary && /^#[0-9A-Fa-f]{6}$/.test(orgColors.primary) ? orgColors.primary : defaultColors.primary,
        secondary: orgColors.secondary && /^#[0-9A-Fa-f]{6}$/.test(orgColors.secondary) ? orgColors.secondary : defaultColors.secondary,
        accent: orgColors.accent && /^#[0-9A-Fa-f]{6}$/.test(orgColors.accent) ? orgColors.accent : defaultColors.accent,
      },
    }

    const dpps = await prisma.dpp.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })

    let applied = 0
    const errors: string[] = []

    for (const dpp of dpps) {
      try {
        const existingContent = await prisma.dppContent.findFirst({
          where: { dppId: dpp.id, isPublished: false },
        })

        const existingStyling = (existingContent?.styling as unknown) as StylingConfig | null
        const currentStyling: StylingConfig = existingStyling ?? {
          colors: { ...defaultColors },
        }

        const updatedStyling: StylingConfig = {
          ...currentStyling,
          logo: orgDefaultStyling.logo ?? currentStyling.logo,
          colors: {
            ...currentStyling.colors,
            ...orgDefaultStyling.colors,
          },
        }

        const validation = await validateStyling(updatedStyling, context)
        if (!validation.valid) {
          errors.push(`DPP ${dpp.id}: ${validation.errors.join(", ")}`)
          continue
        }

        if (existingContent) {
          await prisma.dppContent.update({
            where: { id: existingContent.id },
            data: {
              styling: updatedStyling as unknown as Prisma.InputJsonValue,
              updatedAt: new Date(),
            },
          })
        } else {
          await prisma.dppContent.create({
            data: {
              dppId: dpp.id,
              blocks: [],
              styling: updatedStyling as unknown as Prisma.InputJsonValue,
              isPublished: false,
              createdBy: session.user.id,
            },
          })
        }
        applied++
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        errors.push(`DPP ${dpp.id}: ${msg}`)
      }
    }

    return NextResponse.json({
      message: applied === dpps.length ? "Styling in allen DPPs übernommen." : "Styling teilweise übernommen.",
      applied,
      total: dpps.length,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error: unknown) {
    console.error("[apply-default-styling]", error)
    const message = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
