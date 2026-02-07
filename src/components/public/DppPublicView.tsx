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
import { getHeroImage, type MediaItem } from "@/lib/media/hero-logic"

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
      media: {
        orderBy: [
          { sortOrder: "asc" },
          { uploadedAt: "desc" }
        ]
      },
      versions: versionNumber ? {
        where: { version: versionNumber },
        take: 1,
        select: {
          version: true,
          createdAt: true
        }
      } : {
        where: {
          publicUrl: { not: null }
        },
        orderBy: { version: 'desc' },
        take: 1,
        select: {
          version: true,
          createdAt: true
        }
      }
    }
  })

  if (!dpp || dpp.status !== "PUBLISHED") {
    notFound()
  }

  // Transform DPP to UnifiedContentBlocks (includes template blocks + CMS blocks)
  let unifiedBlocks
  try {
    unifiedBlocks = await transformDppToUnified(dppId, {
      includeVersionInfo: true
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

  // Get version info
  const versionInfo = dpp.versions?.[0] ? {
    version: dpp.versions[0].version,
    createdAt: dpp.versions[0].createdAt
  } : undefined

  // Nur Medien mit gültigem Block (oder ohne blockId) – verwaiste/gelöschte nicht anzeigen
  const validBlockIds = new Set(unifiedBlocks.map((b: { id?: string }) => b.id).filter(Boolean))
  const withoutLogo = ((dpp.media || []) as any[]).filter((m: any) => m.role !== "logo")
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
  const heroFromBasisdaten = getHeroImage(mediaList)
  const fallbackHeroFromBlock =
    basisdatenBlockId &&
    validMedia.find((m: any) => {
      if (!(m.fileType || "").startsWith("image/")) return false
      return m.blockId === basisdatenBlockId || m.blockId == null || m.blockId === ""
    })
  const fallbackHeroLegacy =
    !heroFromBasisdaten &&
    !fallbackHeroFromBlock &&
    validMedia.find(
      (m: any) =>
        (m.fileType || "").startsWith("image/") &&
        (m.blockId == null || m.blockId === "")
    )
  const heroImage =
    heroFromBasisdaten?.storageUrl ??
    (fallbackHeroFromBlock?.storageUrl as string | undefined) ??
    (fallbackHeroLegacy?.storageUrl as string | undefined) ??
    undefined

  // Thumbnails aus allen Bild-Medien (ohne validMedia-Filter), nur Mehrwert (Data-Layer) ausschließen
  const basisdatenOnlyImages = withoutLogo.filter((m: any) => {
    if (!(m.fileType || "").startsWith("image/")) return false
    if (m.blockId && dataBlockIds.has(m.blockId)) return false
    return true
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
      basisdatenHeroImages={basisdatenHeroImages.length > 0 ? basisdatenHeroImages : undefined}
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

