/**
 * DPP Public View
 * 
 * Renders published DPP using the new EditorialDppViewRedesign
 * Combines template blocks and CMS blocks into UnifiedContentBlocks
 */

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { transformDppToUnified } from "@/lib/content-adapter/dpp-transformer"
import EditorialDppViewRedesign from "@/components/editorial/EditorialDppViewRedesign"
import type { MediaItem } from "@/lib/media/hero-logic"

interface DppPublicViewProps {
  dppId: string
  versionNumber?: number
}

export default async function DppPublicView({
  dppId,
  versionNumber
}: DppPublicViewProps) {
  // Load DPP to verify it exists and is published
  const dpp = await prisma.dpp.findUnique({
    where: { id: dppId },
    include: {
      organization: {
        select: { name: true }
      },
      versions: versionNumber
        ? {
            where: { version: versionNumber },
            take: 1,
            include: {
              media: {
                orderBy: [{ uploadedAt: "asc" }]
              }
            }
          }
        : {
            where: { publicUrl: { not: null } },
            orderBy: { version: "desc" },
            take: 1,
            include: {
              media: {
                orderBy: [{ uploadedAt: "asc" }]
              }
            }
          }
    }
  })

  if (!dpp || dpp.status !== "PUBLISHED") {
    notFound()
  }

  // Versionsnummer für Anzeige (URL oder neueste Version)
  const displayVersionNumber = versionNumber ?? (dpp.versions?.[0] as { version: number } | undefined)?.version

  // Transform DPP to UnifiedContentBlocks – bei Version aus Snapshot (Entwurf bleibt unberührt)
  let unifiedBlocks
  try {
    unifiedBlocks = await transformDppToUnified(dppId, {
      includeVersionInfo: true,
      versionNumber: displayVersionNumber,
    })
  } catch (error: any) {
    console.error("[DppPublicView] Error transforming DPP:", error)
    // Fallback: Return error message or empty state
    return (
      <div style={{
        padding: "2rem",
        textAlign: "center",
        color: "#7A7A7A"
      }}>
        <p>Fehler beim Laden des Produktpasses</p>
      </div>
    )
  }

  // Get version info and MEDIEN AUS DER VERSION (nicht aus dem Entwurf)
  // So werden nur Bilder angezeigt, die zum Zeitpunkt der Veröffentlichung im Draft waren.
  const version = dpp.versions?.[0] as { version: number; createdAt: Date; media?: Array<{ id: string; storageUrl: string; fileType: string; role?: string | null; blockId?: string | null; fieldKey?: string | null; fileName?: string }> } | undefined
  const versionInfo = version ? { version: version.version, createdAt: version.createdAt } : undefined
  const versionMediaList = (version?.media ?? []) as Array<{ id: string; storageUrl: string; fileType: string; role?: string | null; blockId?: string | null; fieldKey?: string | null; fileName?: string }>

  // Nur Medien mit gültigem Block (oder ohne blockId) – verwaiste/gelöschte nicht anzeigen
  const validBlockIds = new Set(unifiedBlocks.map((b: { id?: string }) => b.id).filter(Boolean))
  const withoutLogo = versionMediaList.filter((m: any) => m.role !== "logo")
  const validMedia = withoutLogo.filter(
    (m: any) => m.blockId == null || m.blockId === "" || validBlockIds.has(m.blockId)
  )
  const mediaList: MediaItem[] = validMedia.map((m: any) => ({
    id: m.id,
    storageUrl: m.storageUrl,
    fileType: m.fileType || "",
    role: m.role ?? undefined,
    blockId: m.blockId ?? undefined,
    fieldKey: m.fieldKey ?? m.fieldId ?? undefined,
    fileName: m.fileName ?? (m.originalFileName as string) ?? "",
  }))
  const spineBlocks = (unifiedBlocks || []).filter(
    (b: { presentation?: { layer?: string } }) => b.presentation?.layer === "spine"
  )
  const spineBlockIds = new Set(spineBlocks.map((b: { id?: string }) => b.id).filter(Boolean))
  const dataBlockIds = new Set(
    (unifiedBlocks || [])
      .filter((b: { presentation?: { layer?: string } }) => b.presentation?.layer === "data")
      .map((b: { id?: string }) => b.id)
      .filter(Boolean)
  )
  const productDataBlock = spineBlocks.find((b: any) =>
    Object.values(b.content?.fields || {}).some(
      (f: any) => f.type === "file-image" || f.type?.startsWith?.("file-image")
    )
  )
  const basisdatenBlockId = productDataBlock?.id ?? spineBlocks[0]?.id
  // Hero nur aus Basisdaten: Block „Basis- & Produktdaten“ oder ohne blockId (Legacy). Keine Bilder aus Mehrwert-Blöcken.
  const basisdatenHeroMediaOnly = withoutLogo.filter((m: any) => {
    if (!(m.fileType || "").startsWith("image/")) return false
    if (m.blockId && dataBlockIds.has(m.blockId)) return false
    return m.blockId === basisdatenBlockId || m.blockId == null || m.blockId === ""
  })
  const heroImage = basisdatenHeroMediaOnly[0]?.storageUrl ?? undefined

  // Thumbnails nur aus dem Basisdaten-Block (blockId = basisdatenBlockId), keine verwaisten Einträge ohne blockId
  const basisdatenOnlyImages = withoutLogo.filter((m: any) => {
    if (!(m.fileType || "").startsWith("image/")) return false
    if (m.blockId && dataBlockIds.has(m.blockId)) return false
    if (!basisdatenBlockId) return false
    return m.blockId === basisdatenBlockId
  })
  const basisdatenHeroImages = basisdatenOnlyImages.map((m: any) => ({
    url: m.storageUrl,
    alt: m.fileName ?? (m.originalFileName as string) ?? ""
  }))

  // Keine zentrale Galerie am Ende: Mehrwert-Bilder werden nur inline in DataSectionsContainer an ihrer Block-Position gerendert (keine Doppelung).
  const galleryImages: Array<{ url: string; alt?: string; caption?: string }> = []

  // Get logo from published content styling
  const publishedContent = await prisma.dppContent.findFirst({
    where: {
      dppId: dppId,
      isPublished: true
    },
    select: {
      styling: true
    }
  })
  
  const styling = publishedContent?.styling as any
  const organizationLogoUrl = styling?.logo?.url || undefined

  // Render using new EditorialDppViewRedesign (wie Vorschau: Hero nur aus Basisdaten, Galerie inkl. Mehrwert)
  return (
    <EditorialDppViewRedesign
      blocks={unifiedBlocks}
      dppName={dpp.name || ""}
      description={dpp.description ?? undefined}
      dppId={dppId}
      brandName={dpp.brand || ""}
      organizationName={dpp.organization?.name || ""}
      organizationLogoUrl={organizationLogoUrl}
      heroImageUrl={heroImage}
      basisdatenHeroImages={basisdatenHeroImages.length > 1 ? basisdatenHeroImages : undefined}
      galleryImages={galleryImages}
      styling={styling ?? null}
      versionInfo={versionInfo}
      basicData={{
        sku: dpp.sku,
        gtin: dpp.gtin,
        countryOfOrigin: dpp.countryOfOrigin
      }}
    />
  )
}

