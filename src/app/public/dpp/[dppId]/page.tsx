/**
 * Public DPP Page - Editorial Style
 * 
 * Premium editorial view for public Digital Product Passports.
 * Shows the latest published version.
 * Accessed via QR codes on physical products.
 * 
 * IMPORTANT: All content is derived from DPP data - no hard-coded content.
 */

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditorialDppView from '@/components/editorial/EditorialDppView'

interface PublicDppPageProps {
  params: Promise<{ dppId: string }>
}

export const dynamic = 'force-dynamic'

export default async function PublicDppPage({ params }: PublicDppPageProps) {
  const { dppId } = await params

  // Fetch latest published version of DPP
  const dpp = await prisma.dpp.findUnique({
    where: { id: dppId },
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
      versions: {
        where: {
          publicUrl: { not: null },
        },
        orderBy: { version: 'desc' },
        take: 1,
        select: {
          version: true,
          createdAt: true,
        },
      },
    },
  })

  if (!dpp || dpp.status !== 'PUBLISHED') {
    notFound()
  }

  const latestVersion = dpp.versions[0]

  // Transform Dpp data to EditorialDppData format
  const editorialData = {
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
    media: dpp.media.map(m => ({
      id: m.id,
      storageUrl: m.storageUrl,
      fileType: m.fileType,
    })),
    versionInfo: latestVersion ? {
      version: latestVersion.version,
      createdAt: latestVersion.createdAt,
    } : undefined,
  }

  return <EditorialDppView dpp={editorialData} />
}
