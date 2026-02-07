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
import { getHeroImage, getGalleryImages, type MediaItem } from "@/lib/media/hero-logic"

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
        orderBy: { uploadedAt: "desc" }
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

  // Hero = erstes Bild aus Basis- & Produktdaten (role "primary_product_image"). Fallback: erstes Bild mit blockId = Basisdaten-Block.
  const withoutLogo = ((dpp.media || []) as any[]).filter((m: any) => m.role !== "logo")
  const mediaList: MediaItem[] = withoutLogo.map((m: any) => ({
    id: m.id,
    storageUrl: m.storageUrl,
    fileType: m.fileType || "",
    role: m.role ?? undefined,
    blockId: m.blockId ?? undefined,
    fieldKey: m.fieldKey ?? m.fieldId ?? undefined,
    fileName: m.fileName ?? (m.originalFileName as string) ?? "",
  }))
  const heroFromBasisdaten = getHeroImage(mediaList)
  const basisdatenBlockId = unifiedBlocks.find((b: { order?: number }) => b.order === 0)?.id
  const fallbackHeroFromBlock =
    basisdatenBlockId &&
    withoutLogo.find(
      (m: any) =>
        m.blockId === basisdatenBlockId && (m.fileType || "").startsWith("image/")
    )
  const heroImage =
    heroFromBasisdaten?.storageUrl ??
    (fallbackHeroFromBlock?.storageUrl as string | undefined) ??
    undefined

  // Galerie: weitere Basisdaten-Bilder (2+) + Bilder aus Mehrwert-Blöcken
  const galleryFromBasisdaten = getGalleryImages(mediaList)
  const galleryFromMehrwert = unifiedBlocks
    .filter((b: { blockKey?: string }) => b.blockKey === "image")
    .map((b: { content?: { fields?: { url?: { value?: string }; alt?: { value?: string }; caption?: { value?: string } } } }) => {
      const url = b.content?.fields?.url?.value
      if (!url || typeof url !== "string") return null
      return {
        url: String(url),
        alt: b.content?.fields?.alt?.value ? String(b.content.fields.alt.value) : undefined,
        caption: b.content?.fields?.caption?.value ? String(b.content.fields.caption.value) : undefined,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
  const galleryImages = [
    ...galleryFromBasisdaten.map((m) => ({ url: m.storageUrl, alt: m.fileName })),
    ...galleryFromMehrwert,
  ]

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

