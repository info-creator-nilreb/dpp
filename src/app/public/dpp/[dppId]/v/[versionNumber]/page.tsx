/**
 * Public DPP Version Page - Editorial Style
 * 
 * Premium editorial view for a specific DPP version.
 * Same editorial style as main public page, but shows specific version.
 */

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditorialDppView from '@/components/editorial/EditorialDppView'

interface PublicVersionPageProps {
  params: Promise<{ dppId: string; versionNumber: string }>
}

export const dynamic = 'force-dynamic'

export default async function PublicVersionPage({ params }: PublicVersionPageProps) {
  const resolvedParams = await params
  const versionNumber = parseInt(resolvedParams.versionNumber, 10)
  
  if (isNaN(versionNumber)) {
    notFound()
  }

  // Load specific version
  const version = await prisma.dppVersion.findUnique({
    where: {
      dppId_version: {
        dppId: resolvedParams.dppId,
        version: versionNumber,
      },
    },
    include: {
      dpp: {
        include: {
          organization: {
            select: {
              name: true,
            },
          },
          media: {
            orderBy: { uploadedAt: 'asc' },
            take: 10,
          },
        },
      },
    },
  })

  if (!version) {
    notFound()
  }

  // Transform DppVersion data to EditorialDppData format
  const editorialData = {
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
    media: version.dpp.media.map(m => ({
      id: m.id,
      storageUrl: m.storageUrl,
      fileType: m.fileType,
    })),
    versionInfo: {
      version: version.version,
      createdAt: version.createdAt,
    },
  }

  return <EditorialDppView dpp={editorialData} />
}
