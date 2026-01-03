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
import DppPublicView from '@/components/public/DppPublicView'

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

  // Use combined view: Compliance + CMS
  return <DppPublicView dppId={dppId} />
}
