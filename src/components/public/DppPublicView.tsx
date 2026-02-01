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

  // Hero = Produktbild aus Basisdaten (niemals Logo). Logo nur für Platzierung oben links.
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
  const heroImage =
    heroFromBasisdaten?.storageUrl ??
    withoutLogo.find((m: any) => m.role === "hero_image" || m.role === "product_image")?.storageUrl ??
    withoutLogo.find((m: any) => m.blockId && (m.fileType || "").startsWith("image/"))?.storageUrl ??
    withoutLogo.find((m: any) => (m.fileType || "").startsWith("image/"))?.storageUrl

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

  // Render using new EditorialDppViewRedesign
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
      versionInfo={versionInfo}
      basicData={{
        sku: dpp.sku,
        gtin: dpp.gtin,
        countryOfOrigin: dpp.countryOfOrigin
      }}
    />
  )
}

