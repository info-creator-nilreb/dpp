/**
 * DPP Public View
 * 
 * Renders published DPP with:
 * 1. Compliance sections (always, from template)
 * 2. CMS content blocks (if available and allowed)
 * 
 * Strict separation: CMS never replaces or hides compliance data
 */

import { prisma } from "@/lib/prisma"
import { BlocksRenderer } from "@/components/cms/renderers/BlockRenderer"
import { resolveTheme } from "@/lib/cms/validation"
import EditorialDppView from "@/components/editorial/EditorialDppView"

interface DppPublicViewProps {
  dppId: string
  versionNumber?: number
}

export default async function DppPublicView({
  dppId,
  versionNumber
}: DppPublicViewProps) {
  // Load DPP or version
  let dppData: any = null
  let cmsContent: any = null
  let styling: any = null

  if (versionNumber) {
    // Load specific version
    const version = await prisma.dppVersion.findUnique({
      where: {
        dppId_version: {
          dppId,
          version: versionNumber
        }
      },
      include: {
        dpp: {
          include: {
            organization: {
              select: { name: true }
            },
            media: {
              orderBy: { uploadedAt: "asc" },
              take: 10
            }
          }
        }
      }
    })

    if (!version) {
      return null
    }

    dppData = {
      id: version.id,
      name: version.name,
      description: version.description,
      sku: version.sku,
      gtin: version.gtin,
      brand: version.brand,
      countryOfOrigin: version.countryOfOrigin,
      materials: version.materials,
      materialSource: version.materialSource,
      careInstructions: version.careInstructions,
      isRepairable: version.isRepairable,
      sparePartsAvailable: version.sparePartsAvailable,
      lifespan: version.lifespan,
      conformityDeclaration: version.conformityDeclaration,
      disposalInfo: version.disposalInfo,
      takebackOffered: version.takebackOffered,
      takebackContact: version.takebackContact,
      secondLifeInfo: version.secondLifeInfo,
      organization: version.dpp.organization,
      media: version.dpp.media.map((m: any) => ({
        id: m.id,
        storageUrl: m.storageUrl,
        fileType: m.fileType
      })),
      versionInfo: {
        version: version.version,
        createdAt: version.createdAt
      }
    }
  } else {
    // Load latest published DPP
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: {
          select: { name: true }
        },
        media: {
          orderBy: { uploadedAt: "asc" },
          take: 10
        }
      }
    })

    if (!dpp || dpp.status !== "PUBLISHED") {
      return null
    }

    dppData = {
      id: dpp.id,
      name: dpp.name,
      description: dpp.description,
      sku: dpp.sku,
      gtin: dpp.gtin,
      brand: dpp.brand,
      countryOfOrigin: dpp.countryOfOrigin,
      materials: dpp.materials,
      materialSource: dpp.materialSource,
      careInstructions: dpp.careInstructions,
      isRepairable: dpp.isRepairable,
      sparePartsAvailable: dpp.sparePartsAvailable,
      lifespan: dpp.lifespan,
      conformityDeclaration: dpp.conformityDeclaration,
      disposalInfo: dpp.disposalInfo,
      takebackOffered: dpp.takebackOffered,
      takebackContact: dpp.takebackContact,
      secondLifeInfo: dpp.secondLifeInfo,
      organization: dpp.organization,
      media: dpp.media
    }
  }

  // Load CMS content (published only)
  const content = await prisma.dppContent.findFirst({
    where: {
      dppId,
      isPublished: true
    },
    orderBy: { updatedAt: "desc" }
  })

  if (content) {
    cmsContent = {
      blocks: content.blocks,
      styling: content.styling
    }
  }

  // Render: Compliance first, then CMS blocks
  return (
    <div className="dpp-public-view">
      {/* Compliance Sections (always rendered) */}
      <EditorialDppView dpp={dppData} />

      {/* CMS Content Blocks (if available) */}
      {cmsContent && cmsContent.blocks && cmsContent.blocks.length > 0 && (
        <div className="cms-content-section mt-12">
          <BlocksRenderer
            blocks={cmsContent.blocks}
            styling={cmsContent.styling}
          />
        </div>
      )}
    </div>
  )
}

